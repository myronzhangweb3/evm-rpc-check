"use client";

import { useState, useEffect } from 'react';
import { checkRpcMethods, rpcMethods } from '../utils/rpcChecker';

export default function Home() {
  const [rpcUrl, setRpcUrl] = useState('');
  const [methods, setMethods] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('rpcHistory');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rpcHistory', JSON.stringify(history));
    }
  }, [history]);

  const updateConsole = (message: string) => {
    setConsoleOutput((prevOutput) => [...prevOutput, message]);
  };

  const handleCheckMethods = async () => {
    setLoading(true);
    let availableMethods: string[] = [];
    try {
      availableMethods = await checkRpcMethods(rpcUrl, updateConsole);
    } catch (error) {
      console.error('Error checking RPC methods:', error);
      updateConsole(`Error checking RPC methods: ${error}`);
    } finally {
      setMethods(availableMethods as string[]);
      if (rpcUrl && !history.includes(rpcUrl)) {
        setHistory((prevHistory) => [...prevHistory, rpcUrl]);
      }
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', margin: '0 auto', maxWidth: '800px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>EVM RPC Method Checker</h1>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          list="rpc-history"
          value={rpcUrl}
          onChange={(e) => setRpcUrl(e.target.value)}
          placeholder="Enter RPC URL"
          style={{
            padding: '10px',
            width: '100%',
            maxWidth: '300px',
            borderRadius: '5px',
            border: '1px solid #ccc',
            marginBottom: '10px',
            marginRight: '10px',
            color: 'black',
            height: '45px'
          }}
        />
        <datalist id="rpc-history">
          {history.map((url, index) => (
            <option key={index} value={url} />
          ))}
        </datalist>
        <button
          onClick={handleCheckMethods}
          disabled={loading || !rpcUrl}
          style={{
            height: '45px',
            padding: '0 20px',
            borderRadius: '5px',
            border: 'none',
            backgroundColor: loading || !rpcUrl ? '#ccc' : '#007BFF',
            color: '#fff',
            cursor: loading || !rpcUrl ? 'not-allowed' : 'pointer',
            width: '100%',
            maxWidth: '200px'
          }}
        >
          {loading ? 'Checking...' : 'Check RPC Methods'}
        </button>
      </div>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', color: '#007BFF' }}>Loading...</div>
            <div style={{ marginTop: '10px' }}>
              <div className="spinner" style={{
                width: '50px',
                height: '50px',
                border: '5px solid #f3f3f3',
                borderTop: '5px solid #007BFF',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ borderBottom: '2px solid #ddd', padding: '10px', textAlign: 'left' }}>Method</th>
                <th style={{ borderBottom: '2px solid #ddd', padding: '10px', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rpcMethods.map((method: string) => (
                <tr key={method}>
                  <td style={{ borderBottom: '1px solid #ddd', padding: '10px' }}>{method}</td>
                  <td style={{ borderBottom: '1px solid #ddd', padding: '10px' }}>
                    <span style={{ color: methods.includes(method) ? 'green' : 'red' }}>●</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div>
        <div style={{ marginTop: '20px' }}>
          <h2>Console Output</h2>
          <pre style={{ backgroundColor: '#f8f8f8', padding: '10px', borderRadius: '5px', overflowY: 'auto' }}>
            {consoleOutput.map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  );
}
