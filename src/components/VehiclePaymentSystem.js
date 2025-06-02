import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Car, Calendar, CreditCard, Search, Download, Check, X } from 'lucide-react';

const VehiclePaymentSystem = () => {
  const [vehicles, setVehicles] = useState([]);
  const [dailySessions, setDailySessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('collection'); // 'collection' or 'management'
  const [newVehicle, setNewVehicle] = useState({
    regNumber: '',
    notes: ''
  });

  // Load data from memory on component mount
  useEffect(() => {
    const savedVehicles = window.vehicleDatabase || [];
    const savedSessions = window.dailySessionsData || [];
    setVehicles(savedVehicles);
    setDailySessions(savedSessions);
  }, []);

  // Save data to memory whenever data changes
  useEffect(() => {
    window.vehicleDatabase = vehicles;
  }, [vehicles]);

  useEffect(() => {
    window.dailySessionsData = dailySessions;
  }, [dailySessions]);

  const startNewCollectionDay = () => {
    const today = new Date().toISOString().split('T')[0];
    const existingSession = dailySessions.find(session => session.date === today);
    
    if (existingSession) {
      setCurrentSession(existingSession);
    } else {
      const newSession = {
        id: Date.now(),
        date: today,
        vehicles: vehicles.map(vehicle => ({
          ...vehicle,
          sessionStatus: 'pending', // 'paid', 'not-available', 'pending'
          sessionNotes: ''
        }))
      };
      setDailySessions([...dailySessions, newSession]);
      setCurrentSession(newSession);
    }
    setActiveTab('collection');
  };

  const updateSessionVehicle = (vehicleId, updates) => {
    if (!currentSession) return;
    
    const updatedSession = {
      ...currentSession,
      vehicles: currentSession.vehicles.map(v => 
        v.id === vehicleId ? { ...v, ...updates } : v
      )
    };
    
    setCurrentSession(updatedSession);
    setDailySessions(dailySessions.map(session => 
      session.id === currentSession.id ? updatedSession : session
    ));

    // Update vehicle's payment history
    if (updates.sessionStatus === 'paid') {
      setVehicles(vehicles.map(v => {
        if (v.id === vehicleId) {
          const paymentHistory = v.paymentHistory || [];
          const newPayment = {
            date: currentSession.date,
            notes: updates.sessionNotes || ''
          };
          return {
            ...v,
            paymentHistory: [...paymentHistory, newPayment],
            lastPaidDate: currentSession.date,
            totalPayments: (v.totalPayments || 0) + 1
          };
        }
        return v;
      }));
    }
  };

  const handleAddVehicle = () => {
    if (!newVehicle.regNumber) {
      alert('Please fill in Registration Number');
      return;
    }

    const vehicleData = {
      ...newVehicle,
      id: editingVehicle ? editingVehicle.id : Date.now(),
      regNumber: newVehicle.regNumber.toUpperCase(),
      dateAdded: editingVehicle ? editingVehicle.dateAdded : new Date().toISOString().split('T')[0],
      totalPayments: editingVehicle ? editingVehicle.totalPayments : 0,
      paymentHistory: editingVehicle ? editingVehicle.paymentHistory : [],
      lastPaidDate: editingVehicle ? editingVehicle.lastPaidDate : null
    };

    if (editingVehicle) {
      setVehicles(vehicles.map(v => v.id === editingVehicle.id ? vehicleData : v));
    } else {
      setVehicles([...vehicles, vehicleData]);
    }

    resetForm();
  };

  const resetForm = () => {
    setNewVehicle({
      regNumber: '',
      notes: ''
    });
    setShowAddForm(false);
    setEditingVehicle(null);
  };

  const handleEdit = (vehicle) => {
    setNewVehicle(vehicle);
    setEditingVehicle(vehicle);
    setShowAddForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle? This will remove all payment history.')) {
      setVehicles(vehicles.filter(v => v.id !== id));
    }
  };

  const getVehicleStats = (vehicle) => {
    const history = vehicle.paymentHistory || [];
    const avgDaysBetweenPayments = history.length > 1 ? 
      Math.round((new Date(history[history.length - 1].date) - new Date(history[0].date)) / (1000 * 60 * 60 * 24) / (history.length - 1)) : 0;
    
    return {
      totalPayments: history.length,
      avgFrequency: avgDaysBetweenPayments
    };
  };

  const exportSessionData = () => {
    if (!currentSession) return;
    
    const csvContent = [
      ['Date', 'Registration', 'Status', 'Notes'],
      ...currentSession.vehicles.map(v => [
        currentSession.date,
        v.regNumber,
        v.sessionStatus,
        v.sessionNotes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collection-session-${currentSession.date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportAllData = () => {
    const csvContent = [
      ['Registration', 'Date Added', 'Total Payments', 'Last Paid Date', 'Notes'],
      ...vehicles.map(v => {
        const stats = getVehicleStats(v);
        return [
          v.regNumber,
          v.dateAdded,
          stats.totalPayments,
          v.lastPaidDate || 'Never',
          v.notes || ''
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicle-database-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.regNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const sessionStats = currentSession ? {
    total: currentSession.vehicles.length,
    paid: currentSession.vehicles.filter(v => v.sessionStatus === 'paid').length,
    notAvailable: currentSession.vehicles.filter(v => v.sessionStatus === 'not-available').length,
    pending: currentSession.vehicles.filter(v => v.sessionStatus === 'pending').length
  } : null;

  if (activeTab === 'management') {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Car className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Vehicle Database Management</h1>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('collection')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Collection Mode
                </button>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Vehicle</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-blue-800 text-sm font-medium">Total Vehicles</div>
                <div className="text-2xl font-bold text-blue-900">{vehicles.length}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-green-800 text-sm font-medium">Active Payers</div>
                <div className="text-2xl font-bold text-green-900">
                  {vehicles.filter(v => v.paymentHistory && v.paymentHistory.length > 0).length}
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={exportAllData}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700"
              >
                <Download className="h-4 w-4" />
                <span>Export Database</span>
              </button>
            </div>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold mb-4">
                {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Registration Number *"
                  value={newVehicle.regNumber}
                  onChange={(e) => setNewVehicle({...newVehicle, regNumber: e.target.value})}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Notes"
                  value={newVehicle.notes}
                  onChange={(e) => setNewVehicle({...newVehicle, notes: e.target.value})}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleAddVehicle}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex-1"
                  >
                    {editingVehicle ? 'Update' : 'Add'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Vehicle List */}
          <div className="p-6">
            {filteredVehicles.length === 0 ? (
              <div className="text-center py-12">
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No vehicles found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left p-4 font-semibold">Registration</th>
                      <th className="text-left p-4 font-semibold">Payment Stats</th>
                      <th className="text-left p-4 font-semibold">Last Paid</th>
                      <th className="text-left p-4 font-semibold">Notes</th>
                      <th className="text-left p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVehicles.map((vehicle) => {
                      const stats = getVehicleStats(vehicle);
                      return (
                        <tr key={vehicle.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-4 font-mono font-semibold">{vehicle.regNumber}</td>
                          <td className="p-4">
                            <div className="text-sm">
                              <div>{stats.totalPayments} payments</div>
                            </div>
                          </td>
                          <td className="p-4 text-sm">{vehicle.lastPaidDate || 'Never'}</td>
                          <td className="p-4 text-sm text-gray-600">{vehicle.notes || 'N/A'}</td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(vehicle)}
                                className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(vehicle.id)}
                                className="bg-red-600 text-white p-2 rounded hover:bg-red-700"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-8 w-8 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">Daily Collection</h1>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('management')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Manage Vehicles
              </button>
              {!currentSession ? (
                <button
                  onClick={startNewCollectionDay}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Start Collection Day</span>
                </button>
              ) : (
                <button
                  onClick={exportSessionData}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-purple-700"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Session</span>
                </button>
              )}
            </div>
          </div>

          {/* Session Stats */}
          {sessionStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-blue-800 text-sm font-medium">Total</div>
                <div className="text-2xl font-bold text-blue-900">{sessionStats.total}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-green-800 text-sm font-medium">Paid</div>
                <div className="text-2xl font-bold text-green-900">{sessionStats.paid}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="text-red-800 text-sm font-medium">Not Available</div>
                <div className="text-2xl font-bold text-red-900">{sessionStats.notAvailable}</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="text-yellow-800 text-sm font-medium">Pending</div>
                <div className="text-2xl font-bold text-yellow-900">{sessionStats.pending}</div>
              </div>
            </div>
          )}
        </div>

        {/* Collection Interface */}
        {currentSession ? (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Collection Session - {currentSession.date}</h2>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-full md:w-96"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentSession.vehicles
                .filter(v => 
                  v.regNumber.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((vehicle) => (
                <div key={vehicle.id} className={`border rounded-lg p-4 ${
                  vehicle.sessionStatus === 'paid' ? 'bg-green-50 border-green-200' :
                  vehicle.sessionStatus === 'not-available' ? 'bg-red-50 border-red-200' :
                  'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-mono font-bold text-lg">{vehicle.regNumber}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Payments: {vehicle.totalPayments || 0}</div>
                    </div>
                  </div>

                  <div className="flex space-x-2 mb-3">
                    <button
                      onClick={() => updateSessionVehicle(vehicle.id, { sessionStatus: 'paid' })}
                      className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center space-x-1 transition-colors ${
                        vehicle.sessionStatus === 'paid' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                      }`}
                    >
                      <Check className="h-4 w-4" />
                      <span>Paid</span>
                    </button>
                    <button
                      onClick={() => updateSessionVehicle(vehicle.id, { sessionStatus: 'not-available' })}
                      className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center space-x-1 transition-colors ${
                        vehicle.sessionStatus === 'not-available' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                      }`}
                    >
                      <X className="h-4 w-4" />
                      <span>N/A</span>
                    </button>
                  </div>

                  {vehicle.sessionStatus === 'paid' && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Notes (optional)"
                        value={vehicle.sessionNotes || ''}
                        onChange={(e) => updateSessionVehicle(vehicle.id, { sessionNotes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Ready to Start Collection</h2>
            <p className="text-gray-500 mb-6">
              You have {vehicles.length} vehicles in your database. Click "Start Collection Day" to begin.
            </p>
            <button
              onClick={startNewCollectionDay}
              className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-700 transition-colors"
              disabled={vehicles.length === 0}
            >
              Start Collection Day
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehiclePaymentSystem;
