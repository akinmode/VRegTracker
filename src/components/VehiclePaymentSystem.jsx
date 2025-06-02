import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Car, Calendar, CreditCard, Search, Download, Check, X } from 'lucide-react';

const VehiclePaymentSystem = () => {
  const [vehicles, setVehicles] = useState([]);
  const [dailySessions, setDailySessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('collection');
  const [newVehicle, setNewVehicle] = useState({
    regNumber: '',
    ownerName: '',
    contactInfo: '',
    paymentAmount: '',
    notes: ''
  });

  useEffect(() => {
    const savedVehicles = window.vehicleDatabase || [];
    const savedSessions = window.dailySessionsData || [];
    setVehicles(savedVehicles);
    setDailySessions(savedSessions);
  }, []);

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
          sessionStatus: 'pending',
          sessionNotes: '',
          sessionAmount: vehicle.paymentAmount || ''
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
    if (updates.sessionStatus === 'paid') {
      setVehicles(vehicles.map(v => {
        if (v.id === vehicleId) {
          const paymentHistory = v.paymentHistory || [];
          const newPayment = {
            date: currentSession.date,
            amount: updates.sessionAmount || v.paymentAmount,
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
      alert('Please fill in the Registration Number');
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
    setNewVehicle({ regNumber: '', ownerName: '', contactInfo: '', paymentAmount: '', notes: '' });
    setShowAddForm(false);
    setEditingVehicle(null);
  };

  const handleEdit = (vehicle) => {
    setNewVehicle(vehicle);
    setEditingVehicle(vehicle);
    setShowAddForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this vehicle and its payment history?')) {
      setVehicles(vehicles.filter(v => v.id !== id));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Vehicle Payment System</h1>
      <button onClick={() => setShowAddForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded mb-4">
        Add Vehicle
      </button>
      {showAddForm && (
        <div className="mb-6">
          <input
            type="text"
            placeholder="Registration Number *"
            value={newVehicle.regNumber}
            onChange={(e) => setNewVehicle({ ...newVehicle, regNumber: e.target.value })}
            className="border px-3 py-2 mr-2"
          />
          <input
            type="text"
            placeholder="Owner Name"
            value={newVehicle.ownerName}
            onChange={(e) => setNewVehicle({ ...newVehicle, ownerName: e.target.value })}
            className="border px-3 py-2 mr-2"
          />
          <input
            type="text"
            placeholder="Contact Info"
            value={newVehicle.contactInfo}
            onChange={(e) => setNewVehicle({ ...newVehicle, contactInfo: e.target.value })}
            className="border px-3 py-2 mr-2"
          />
          <input
            type="number"
            placeholder="Payment Amount"
            value={newVehicle.paymentAmount}
            onChange={(e) => setNewVehicle({ ...newVehicle, paymentAmount: e.target.value })}
            className="border px-3 py-2 mr-2"
          />
          <input
            type="text"
            placeholder="Notes"
            value={newVehicle.notes}
            onChange={(e) => setNewVehicle({ ...newVehicle, notes: e.target.value })}
            className="border px-3 py-2 mr-2"
          />
          <button onClick={handleAddVehicle} className="bg-green-600 text-white px-4 py-2 rounded mr-2">
            {editingVehicle ? 'Update' : 'Add'}
          </button>
          <button onClick={resetForm} className="bg-gray-600 text-white px-4 py-2 rounded">
            Cancel
          </button>
        </div>
      )}
      <ul>
        {vehicles.map(vehicle => (
          <li key={vehicle.id} className="mb-2 border-b pb-2">
            <div className="font-bold">{vehicle.regNumber}</div>
            <div className="text-sm">Owner: {vehicle.ownerName || 'N/A'}</div>
            <div className="text-sm">Contact: {vehicle.contactInfo || 'N/A'}</div>
            <button onClick={() => handleEdit(vehicle)} className="text-blue-600 mr-2">Edit</button>
            <button onClick={() => handleDelete(vehicle.id)} className="text-red-600">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VehiclePaymentSystem;
