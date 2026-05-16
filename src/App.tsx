/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PublicView from './pages/PublicView';
import AdminDashboard from './pages/AdminDashboard';
import StatsPage from './pages/StatsPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicView />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/stats" element={<StatsPage />} />
      </Routes>
    </Router>
  );
}
