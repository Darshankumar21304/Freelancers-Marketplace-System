import React from 'react';
import './StyleTest.css';

export default function StyleTest() {
  return (
    <div className="style-test-page">
      <div className="style-test-header">
        <h1>Style System Test</h1>
        <p>Verifying Plain CSS components and layout primitives.</p>
      </div>

      <div className="style-test-grid">
        <div className="style-test-card">
          <h2>Cards & Containers</h2>
          <p>This is a standard card with padding, border-radius, and subtle shadow.</p>
          <div className="style-test-badge">Active Status</div>
        </div>

        <div className="style-test-card">
          <h2>Buttons</h2>
          <div className="style-test-flex-row">
            <button className="btn btn-primary">Primary Button</button>
            <button className="btn btn-secondary">Secondary Button</button>
          </div>
        </div>

        <div className="style-test-card">
          <h2>Forms</h2>
          <div className="style-test-form-group">
            <label>Text Input</label>
            <input type="text" className="form-input" placeholder="Enter text..." />
          </div>
          <div className="style-test-form-group">
            <label>Select</label>
            <select className="form-select">
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
