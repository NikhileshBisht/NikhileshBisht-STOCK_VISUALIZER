import React, { useState, useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import Papa from 'papaparse';
import './StockChart.css';

const StockChart = () => {
    const [symbol, setSymbol] = useState('');
    const [trades, setTrades] = useState([]); // CSV trades
    const [userBookmarks, setUserBookmarks] = useState([]); // User created bookmarks
    const [selectedFile, setSelectedFile] = useState(null);
    const [showSymbolSelect, setShowSymbolSelect] = useState(false);
    const [availableSymbols, setAvailableSymbols] = useState([]);

    // Interaction States
    const [menuPosition, setMenuPosition] = useState(null); // { x, y, time, price }
    const [deleteButton, setDeleteButton] = useState(null); // { x, y, bookmarkId }

    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const lineSeriesRef = useRef(null);
    const userBookmarksRef = useRef([]); // Ref to access latest bookmarks in event handlers
    const deleteHideTimeoutRef = useRef(null);

    // Keep ref synced with state
    useEffect(() => {
        userBookmarksRef.current = userBookmarks;
    }, [userBookmarks]);

    const knownSymbols = {
        "HAL": [
            { symbol: "HAL.NS", label: "Hindustan Aeronautics Ltd (NSE)" },
            { symbol: "HAL", label: "Halliburton Company (NYSE)" }
        ]
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                const data = results.data;
                if (data.length === 0) {
                    alert("CSV is empty or malformed.");
                    return;
                }

                const rawSymbol = data[0].symbol.trim().toUpperCase();
                if (knownSymbols[rawSymbol]) {
                    setAvailableSymbols(knownSymbols[rawSymbol]);
                    setShowSymbolSelect(true);
                    setSymbol(knownSymbols[rawSymbol][0].symbol);
                } else {
                    const finalSymbol = rawSymbol.endsWith(".NS") ? rawSymbol : rawSymbol + ".NS";
                    setSymbol(finalSymbol);
                    setShowSymbolSelect(false);
                }

                // Group trades
                const grouped = {};
                for (const row of data) {
                    const key = row.trade_date + "_" + row.trade_type;
                    const price = parseFloat(row.price);
                    const qty = parseFloat(row.quantity);
                    if (!grouped[key]) {
                        grouped[key] = { total: 0, volume: 0, date: row.trade_date, type: row.trade_type };
                    }
                    grouped[key].total += price * qty;
                    grouped[key].volume += qty;
                }

                const processedTrades = Object.values(grouped).map(trade => {
                    const avgPrice = trade.total / trade.volume;
                    const timestamp = Math.floor(new Date(trade.date).getTime() / 1000);
                    return {
                        time: timestamp,
                        position: 'inBar', // Places marker on the closing price (the line)
                        color: trade.type.toLowerCase() === 'buy' ? 'green' : 'red',
                        shape: 'circle',
                        // text removed as per user request
                        id: `csv-${timestamp}-${trade.type}`, // distinct ID
                        isUserCreated: false
                    };
                });

                setTrades(processedTrades);
            }
        });
    };

    const updateMarkers = () => {
        if (lineSeriesRef.current) {
            // Merge CSV trades and User Bookmarks, sort by time
            const allMarkers = [...trades, ...userBookmarks].sort((a, b) => a.time - b.time);
            lineSeriesRef.current.setMarkers(allMarkers);
        }
    };

    // Update markers whenever trades or bookmarks change
    useEffect(() => {
        updateMarkers();
    }, [trades, userBookmarks]);

    const loadChart = () => {
        if (!symbol) {
            alert("Please upload a CSV and select a symbol.");
            return;
        }

        // Clear existing chart
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
        }

        // Create new chart with v3.8.0 API
        const chart = createChart(chartContainerRef.current, {
            layout: {
                backgroundColor: '#ffffff',
                textColor: '#000'
            },
            grid: {
                vertLines: { color: '#eee' },
                horzLines: { color: '#eee' }
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false
            },
            rightPriceScale: {
                autoScale: true,
                mode: 1
            },
            width: chartContainerRef.current.clientWidth,
            height: 600
        });

        chartRef.current = chart;

        const lineSeries = chart.addLineSeries({
            color: '#2962FF',
            lineWidth: 2,
        });
        lineSeriesRef.current = lineSeries;

        const to = Math.floor(Date.now() / 1000);
        const from = to - 60 * 60 * 24 * 180;

        const corsProxy = "https://corsproxy.io/?";
        const url = corsProxy + `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?symbol=${symbol}&period1=${from}&period2=${to}&interval=1d&includePrePost=false`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const result = data.chart.result[0];
                const timestamps = result.timestamp;
                const closes = result.indicators.quote[0].close;

                const priceData = timestamps.map((t, i) => ({
                    time: t,
                    value: closes[i]
                }));

                lineSeries.setData(priceData);
                updateMarkers(); // Set initial markers
            })
            .catch(error => {
                console.error("API Error:", error);
                alert("Failed to load chart data.");
            });

        // -------------------------
        // INTERACTION LOGIC
        // -------------------------

        // 1. Click to open "Buy/Sell" menu
        chart.subscribeClick((param) => {
            if (!param.point || !param.time || !param.seriesPrices.size) {
                setMenuPosition(null);
                return;
            }

            // Get price from the series
            const price = param.seriesPrices.get(lineSeries);
            if (!price) return;

            // Convert coords to relative container position
            // Use timeToCoordinate and priceToCoordinate to snap exactly to the data point on the line
            const y = lineSeries.priceToCoordinate(price);
            const x = chart.timeScale().timeToCoordinate(param.time);

            if (x === null || y === null) return;

            setMenuPosition({
                x: x,
                y: y,
                time: param.time,
                price: price
            });

            // Hide delete button if opening menu
            setDeleteButton(null);
        });

        // 2. Hover to check for existing User Bookmarks -> Show Delete
        chart.subscribeCrosshairMove((param) => {
            if (!param.point || !param.time) {
                // Mouse moved off chart? Schedule hide.
                if (!deleteHideTimeoutRef.current) {
                    deleteHideTimeoutRef.current = setTimeout(() => {
                        setDeleteButton(null);
                    }, 300);
                }
                return;
            }

            // Check if we are hovering a time that has a USER bookmark
            const bookmark = userBookmarksRef.current.find(b => b.time === param.time);

            if (bookmark && bookmark.isUserCreated) {
                // Clear any pending hide
                if (deleteHideTimeoutRef.current) {
                    clearTimeout(deleteHideTimeoutRef.current);
                    deleteHideTimeoutRef.current = null;
                }

                // Calculate position for the delete button
                const y = lineSeries.priceToCoordinate(bookmark.priceVal);
                const x = chart.timeScale().timeToCoordinate(bookmark.time);

                // Guard against invalid coords (off screen)
                if (x !== null && y !== null) {
                    setDeleteButton({
                        x: x,
                        y: y - 40, // Slightly above the marker
                        bookmarkId: bookmark.id
                    });
                }
            } else {
                if (!deleteHideTimeoutRef.current) {
                    deleteHideTimeoutRef.current = setTimeout(() => {
                        setDeleteButton(null);
                    }, 300);
                }
            }
        });
    };

    const handleAddBookmark = (type) => {
        if (!menuPosition) return;

        const { time, price } = menuPosition;

        const newBookmark = {
            time: time,
            position: 'inBar', // On the line
            color: type === 'buy' ? 'green' : 'red', // Red for sell, Green for buy
            shape: 'circle',
            // text removed as per user request
            id: `user-${Date.now()}`,
            isUserCreated: true,
            priceVal: price // Store raw price for coordinate calc
        };

        setUserBookmarks(prev => [...prev, newBookmark]);
        setMenuPosition(null); // Close menu
    };

    const handleDeleteBookmark = () => {
        if (!deleteButton) return;
        setUserBookmarks(prev => prev.filter(b => b.id !== deleteButton.bookmarkId));
        setDeleteButton(null);
    };

    useEffect(() => {
        // Handle resize
        const handleResize = () => {
            if (chartRef.current && chartContainerRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth
                });
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartRef.current) {
                chartRef.current.remove();
            }
        };
    }, []);

    // Close menu if clicking outside (handled vaguely by chart click, but adding global click handler is safer specifically for the menu UI)
    // For simplicity, we assume generic chart interaction closes logic, or the 'Cancel' button.

    return (
        <div className="stock-chart-wrapper">
            <h1>📈 NSE Chart with Trades (Yahoo Finance)</h1>
            <div className="controls">
                <input
                    type="file"
                    id="csvInput"
                    accept=".csv"
                    onChange={handleFileChange}
                />
                <button onClick={loadChart}>Load Chart</button>
            </div>
            {showSymbolSelect && (
                <div className="symbol-select-container">
                    <label htmlFor="symbolSelect">Select Symbol:</label>
                    <select
                        id="symbolSelect"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                    >
                        {availableSymbols.map(opt => (
                            <option key={opt.symbol} value={opt.symbol}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}
            <div className="chart-container resizable" ref={chartContainerRef}>
                {/* Bookmarks Menu */}
                {menuPosition && (
                    <div
                        className="chart-tooltip"
                        style={{ left: menuPosition.x, top: menuPosition.y }}
                        onMouseLeave={() => setMenuPosition(null)}
                    >
                        <button className="buy-btn" onClick={() => handleAddBookmark('buy')}>Buy Here</button>
                        <button className="sell-btn" onClick={() => handleAddBookmark('sell')}>Sell Here</button>
                    </div>
                )}

                {/* Delete Button */}
                {deleteButton && (
                    <div
                        className="delete-tooltip"
                        style={{ left: deleteButton.x - 20, top: deleteButton.y }}
                        onMouseEnter={() => {
                            if (deleteHideTimeoutRef.current) {
                                clearTimeout(deleteHideTimeoutRef.current);
                                deleteHideTimeoutRef.current = null;
                            }
                        }}
                        onMouseLeave={() => {
                            deleteHideTimeoutRef.current = setTimeout(() => {
                                setDeleteButton(null);
                            }, 300);
                        }}
                    >
                        <button onClick={handleDeleteBookmark}>🗑 Delete Bookmark</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockChart;
