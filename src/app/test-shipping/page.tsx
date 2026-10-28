'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface OrderResult {
  id: string;
  status: string;
  courier?: Record<string, unknown>;
  note?: string;
}

interface OrderDetail {
  id: string;
  status: string;
  courier_tracking_id?: string;
  courier?: Record<string, unknown>;
  [key: string]: unknown;
}

const STATUS_FLOW = [
  { status: 'confirmed', label: 'Confirmed', icon: '📋' },
  { status: 'allocated', label: 'Allocated', icon: '🏢' },
  { status: 'picking_up', label: 'Picking Up', icon: '🚶' },
  { status: 'picked', label: 'Picked', icon: '📦' },
  { status: 'dropping_off', label: 'Dropping Off', icon: '🚚' },
  { status: 'delivered', label: 'Delivered', icon: '✅' },
];

export default function TestShippingPage() {
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [trackingId, setTrackingId] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Form state
  const [courier, setCourier] = useState('jne');
  const [courierType, setCourierType] = useState('reg');
  const [destName, setDestName] = useState('Test Customer');
  const [destPhone, setDestPhone] = useState('08987654321');
  const [destAddress, setDestAddress] = useState('Jl. Sudirman No. 1, Jakarta Selatan');
  const [destPostal, setDestPostal] = useState('12190');

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const createTestOrder = async () => {
    setLoading(true);
    setError('');
    addLog('Creating test order via Biteship sandbox...');

    try {
      const res = await fetch('/api/shipping/test-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courier_company: courier,
          courier_type: courierType,
          destination_name: destName,
          destination_phone: destPhone,
          destination_address: destAddress,
          destination_postal_code: Number(destPostal),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setOrderResult(data.order);
        addLog(`✅ Order created! ID: ${data.order.id}`);
        addLog(`   Status: ${data.order.status}`);
        addLog(`   Courier: ${JSON.stringify(data.order.courier)}`);
      } else {
        setError(data.error || 'Failed to create order');
        addLog(`❌ Error: ${data.error}`);
        if (data.detail) addLog(`   Detail: ${JSON.stringify(data.detail)}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setError(msg);
      addLog(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrder = async (id?: string) => {
    const orderId = id || trackingId || orderResult?.id;
    if (!orderId) {
      setError('Enter an Order ID or create an order first');
      return;
    }

    setLoading(true);
    setError('');
    addLog(`Fetching order ${orderId}...`);

    try {
      const res = await fetch(`/api/shipping/test-order?id=${orderId}`);
      const data = await res.json();

      if (data.success) {
        setOrderDetail(data.order);
        addLog(`📦 Order ${orderId} → Status: ${data.order.status}`);
      } else {
        setError(data.error);
        addLog(`❌ ${data.error}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setError(msg);
      addLog(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const currentStatusIndex = orderDetail
    ? STATUS_FLOW.findIndex((s) => s.status === orderDetail.status)
    : -1;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-light tracking-wider">Biteship Sandbox Test</h1>
            <p className="text-neutral-500 text-sm mt-1">
              Simulasi pengiriman — test order tidak memotong saldo
            </p>
          </div>
          <Link href="/" className="text-neutral-500 hover:text-neutral-300 text-sm underline">
            ← Back to Home
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left — Create Order */}
          <div className="space-y-6">
            <div className="border border-neutral-800 rounded-lg p-5">
              <h2 className="text-sm font-medium tracking-wider text-neutral-400 mb-4">
                1 — CREATE TEST ORDER
              </h2>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-neutral-500 block mb-1">Courier</label>
                    <select
                      value={courier}
                      onChange={(e) => setCourier(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-500"
                    >
                      <option value="jne">JNE</option>
                      <option value="sicepat">SiCepat</option>
                      <option value="jnt">J&T Express</option>
                      <option value="anteraja">AnterAja</option>
                      <option value="tiki">TIKI</option>
                      <option value="pos">Pos Indonesia</option>
                      <option value="grab">Grab</option>
                      <option value="gojek">Gojek</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 block mb-1">Service</label>
                    <select
                      value={courierType}
                      onChange={(e) => setCourierType(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-500"
                    >
                      <option value="reg">Regular</option>
                      <option value="yes">YES / Next Day</option>
                      <option value="oke">OKE / Economy</option>
                      <option value="instant">Instant</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-neutral-500 block mb-1">Destination Name</label>
                  <input
                    value={destName}
                    onChange={(e) => setDestName(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 block mb-1">Phone</label>
                  <input
                    value={destPhone}
                    onChange={(e) => setDestPhone(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 block mb-1">Address</label>
                  <input
                    value={destAddress}
                    onChange={(e) => setDestAddress(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 block mb-1">Postal Code</label>
                  <input
                    value={destPostal}
                    onChange={(e) => setDestPostal(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-500"
                  />
                </div>

                <button
                  onClick={createTestOrder}
                  disabled={loading}
                  className="w-full bg-white text-black font-medium py-2.5 rounded text-sm hover:bg-neutral-200 transition disabled:opacity-40 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? 'Creating...' : '📦  Create Test Order'}
                </button>
              </div>
            </div>

            {/* Track by ID */}
            <div className="border border-neutral-800 rounded-lg p-5">
              <h2 className="text-sm font-medium tracking-wider text-neutral-400 mb-4">
                2 — TRACK ORDER
              </h2>
              <div className="flex gap-2">
                <input
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="Paste Order ID..."
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600"
                />
                <button
                  onClick={() => fetchOrder()}
                  disabled={loading}
                  className="bg-neutral-800 hover:bg-neutral-700 text-sm px-4 py-2 rounded border border-neutral-700 transition disabled:opacity-40"
                >
                  Fetch
                </button>
              </div>
              {orderResult && (
                <button
                  onClick={() => fetchOrder(orderResult.id)}
                  className="mt-3 text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  Refresh: {orderResult.id.slice(0, 20)}...
                </button>
              )}
            </div>
          </div>

          {/* Right — Results */}
          <div className="space-y-6">
            {/* Status flow */}
            {(orderResult || orderDetail) && (
              <div className="border border-neutral-800 rounded-lg p-5">
                <h2 className="text-sm font-medium tracking-wider text-neutral-400 mb-4">
                  STATUS FLOW
                </h2>
                <div className="space-y-2">
                  {STATUS_FLOW.map((step, i) => {
                    const isCurrent = i === currentStatusIndex;
                    const isPast = i < currentStatusIndex;
                    const isCancelled = orderDetail?.status === 'cancelled';
                    return (
                      <div
                        key={step.status}
                        className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition ${
                          isCancelled
                            ? 'opacity-30'
                            : isCurrent
                              ? 'bg-green-950 border border-green-800 text-green-300'
                              : isPast
                                ? 'text-neutral-400 line-through opacity-60'
                                : 'text-neutral-600'
                        }`}
                      >
                        <span className="text-base">{isPast ? '✓' : step.icon}</span>
                        <span>{step.label}</span>
                        {isCurrent && (
                          <span className="ml-auto text-xs bg-green-900 px-2 py-0.5 rounded">
                            CURRENT
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {orderDetail?.status === 'cancelled' && (
                    <div className="flex items-center gap-3 px-3 py-2 rounded text-sm bg-red-950 border border-red-800 text-red-300">
                      <span className="text-base">🚫</span>
                      <span>Cancelled</span>
                      <span className="ml-auto text-xs bg-red-900 px-2 py-0.5 rounded">
                        CURRENT
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-neutral-600 mt-4">
                  💡 Buka{' '}
                  <a
                    href="https://dashboard.biteship.com/orders"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Biteship Dashboard → Pengiriman
                  </a>{' '}
                  untuk update status test order via tombol &quot;Update Status&quot;
                </p>
              </div>
            )}

            {/* Order Info */}
            {orderResult && (
              <div className="border border-neutral-800 rounded-lg p-5">
                <h2 className="text-sm font-medium tracking-wider text-neutral-400 mb-3">
                  ORDER CREATED
                </h2>
                <div className="bg-neutral-900 rounded p-3 text-xs font-mono break-all space-y-1">
                  <div>
                    <span className="text-neutral-500">ID: </span>
                    <span className="text-green-400">{orderResult.id}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Status: </span>
                    <span className="text-yellow-400">{orderResult.status}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(orderResult.id);
                    addLog('📋 Order ID copied to clipboard');
                  }}
                  className="mt-3 text-xs text-neutral-400 hover:text-neutral-200 underline"
                >
                  Copy Order ID
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="border border-red-900 bg-red-950/50 rounded-lg p-4 text-sm text-red-300">
                ❌ {error}
              </div>
            )}

            {/* Logs */}
            <div className="border border-neutral-800 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium tracking-wider text-neutral-400">LOGS</h2>
                {logs.length > 0 && (
                  <button
                    onClick={() => setLogs([])}
                    className="text-xs text-neutral-600 hover:text-neutral-400"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="bg-neutral-900 rounded p-3 max-h-60 overflow-y-auto font-mono text-xs space-y-1">
                {logs.length === 0 ? (
                  <p className="text-neutral-600">No logs yet...</p>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="text-neutral-400 leading-relaxed">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 border border-neutral-800 rounded-lg p-5">
          <h2 className="text-sm font-medium tracking-wider text-neutral-400 mb-3">
            📖 CARA SIMULASI
          </h2>
          <div className="text-sm text-neutral-400 space-y-2">
            <p>
              <strong className="text-neutral-200">Step 1:</strong> Klik &quot;Create Test Order&quot; 
              untuk membuat order sandbox. Catat Order ID yang muncul.
            </p>
            <p>
              <strong className="text-neutral-200">Step 2:</strong> Buka{' '}
              <a
                href="https://dashboard.biteship.com/orders"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                dashboard.biteship.com/orders
              </a>{' '}
              → cari test order Anda (badge WEBHOOK kuning).
            </p>
            <p>
              <strong className="text-neutral-200">Step 3:</strong> Klik &quot;Update Status&quot; 
              berulang: Confirm → Allocate → Picking Up → Picked → Dropping Off → <strong className="text-green-400">Delivered</strong>
            </p>
            <p>
              <strong className="text-neutral-200">Step 4:</strong> Buat order kedua, lalu klik 
              &quot;Update Status&quot; → pilih <strong className="text-red-400">Cancel</strong>
            </p>
            <p>
              <strong className="text-neutral-200">Step 5:</strong> Masukkan kedua Order ID 
              (Delivered + Cancelled) ke{' '}
              <a
                href="https://dashboard.biteship.com/api-activation-form"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                formulir aktivasi API
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-neutral-700 text-xs mt-8">
          Environment: Sandbox (biteship_test.*) — No real couriers, no charges
        </p>
      </div>
    </div>
  );
}
