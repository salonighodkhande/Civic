
    // Database Class for Local Storage Management
    class ComplaintDB {
      constructor() {
        this.dbKey = 'complaintDB';
        this.init();
      }

      init() {
        const existing = this.getAllComplaints();
      }

      saveToStorage(data) {
        const jsonData = JSON.stringify(data, null, 2);
        localStorage.setItem(this.dbKey, jsonData);
      }

      getAllComplaints() {
        try {
          const data = localStorage.getItem(this.dbKey);
          return data ? JSON.parse(data) : [];
        } catch (e) {
          console.error('Error reading database:', e);
          return [];
        }
      }

      addComplaint(complaint) {
        const complaints = this.getAllComplaints();
        complaint.id = this.generateId();
        complaint.status = 'registered';
        complaint.dateCreated = new Date().toISOString();
        complaint.dateUpdated = new Date().toISOString();
        
        complaints.push(complaint);
        this.saveToStorage(complaints);
        return complaint.id;
      }

      getComplaintById(id) {
        const complaints = this.getAllComplaints();
        return complaints.find(c => c.id === id);
      }

      updateComplaintStatus(id, status) {
        const complaints = this.getAllComplaints();
        const complaint = complaints.find(c => c.id === id);
        if (complaint) {
          complaint.status = status;
          complaint.dateUpdated = new Date().toISOString();
          this.saveToStorage(complaints);
          return true;
        }
        return false;
      }

      deleteComplaint(id) {
        let complaints = this.getAllComplaints();
        complaints = complaints.filter(c => c.id !== id);
        this.saveToStorage(complaints);
      }

      generateId() {
        return "C" + Math.random().toString(36).substr(2, 6).toUpperCase();
      }

      exportData() {
        return JSON.stringify(this.getAllComplaints(), null, 2);
      }

      importData(jsonData) {
        try {
          const data = JSON.parse(jsonData);
          if (Array.isArray(data)) {
            this.saveToStorage(data);
            return true;
          }
        } catch (e) {
          console.error('Invalid JSON data:', e);
        }
        return false;
      }

      clearAll() {
        this.saveToStorage([]);
      }

      getStats() {
        const complaints = this.getAllComplaints();
        const stats = {
          total: complaints.length,
          registered: complaints.filter(c => c.status === 'registered').length,
          inProgress: complaints.filter(c => c.status === 'progress').length,
          resolved: complaints.filter(c => c.status === 'resolved').length,
          byType: {}
        };

        complaints.forEach(c => {
          stats.byType[c.type] = (stats.byType[c.type] || 0) + 1;
        });

        return stats;
      }
    }

    // Initialize Database
    const db = new ComplaintDB();
    
    // Form handling
    const form = document.getElementById("complaintForm");
    const msg = document.getElementById("formMsg");
    document.getElementById("year").textContent = new Date().getFullYear();

    form.addEventListener("submit", e => {
      e.preventDefault();
      
      const complaint = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        type: document.getElementById("type").value,
        subject: document.getElementById("subject").value,
        description: document.getElementById("description").value
      };

      const id = db.addComplaint(complaint);
      
      msg.style.color = "green";
      msg.innerHTML = `✔ Complaint submitted successfully.<br>Your Complaint ID: <b>${id}</b>`;
      form.reset();
      
      // Refresh complaints display if visible
      displayComplaints();
    });

    // Display complaints
    function displayComplaints() {
      const container = document.getElementById("complaintsContainer");
      const complaints = db.getAllComplaints();
      
      if (complaints.length === 0) {
        container.innerHTML = "<p>No complaints found. Register your first complaint above!</p>";
        return;
      }

      let html = complaints.map(complaint => `
        <div class="complaint-item">
          <div class="complaint-header">
            <span class="complaint-id">${complaint.id}</span>
            <span class="status ${complaint.status}">${complaint.status.toUpperCase()}</span>
          </div>
          <h4>${complaint.subject}</h4>
          <p><strong>Type:</strong> ${complaint.type}</p>
          <p><strong>Name:</strong> ${complaint.name}</p>
          <p><strong>Description:</strong> ${complaint.description}</p>
          <p><strong>Date:</strong> ${new Date(complaint.dateCreated).toLocaleDateString()}</p>
          <div style="margin-top:10px;">
            <button onclick="updateStatus('${complaint.id}', 'progress')" 
                    ${complaint.status === 'progress' ? 'disabled' : ''}>Mark In Progress</button>
            <button onclick="updateStatus('${complaint.id}', 'resolved')" 
                    ${complaint.status === 'resolved' ? 'disabled' : ''}>Mark Resolved</button>
            <button onclick="deleteComplaint('${complaint.id}')" 
                    style="background:#f44336">Delete</button>
          </div>
        </div>
      `).join("");

      container.innerHTML = html;
    }

    // Filter complaints
    function filterComplaints() {
      const searchId = document.getElementById("searchId").value.toLowerCase();
      const filterType = document.getElementById("filterType").value;
      const filterStatus = document.getElementById("filterStatus").value;
      
      let complaints = db.getAllComplaints();
      
      if (searchId) {
        complaints = complaints.filter(c => c.id.toLowerCase().includes(searchId));
      }
      if (filterType) {
        complaints = complaints.filter(c => c.type === filterType);
      }
      if (filterStatus) {
        complaints = complaints.filter(c => c.status === filterStatus);
      }
      
      const container = document.getElementById("complaintsContainer");
      if (complaints.length === 0) {
        container.innerHTML = "<p>No complaints match your search criteria.</p>";
        return;
      }

      let html = complaints.map(complaint => `
        <div class="complaint-item">
          <div class="complaint-header">
            <span class="complaint-id">${complaint.id}</span>
            <span class="status ${complaint.status}">${complaint.status.toUpperCase()}</span>
          </div>
          <h4>${complaint.subject}</h4>
          <p><strong>Type:</strong> ${complaint.type}</p>
          <p><strong>Name:</strong> ${complaint.name}</p>
          <p><strong>Description:</strong> ${complaint.description}</p>
          <p><strong>Date:</strong> ${new Date(complaint.dateCreated).toLocaleDateString()}</p>
          <div style="margin-top:10px;">
            <button onclick="updateStatus('${complaint.id}', 'progress')" 
                    ${complaint.status === 'progress' ? 'disabled' : ''}>Mark In Progress</button>
            <button onclick="updateStatus('${complaint.id}', 'resolved')" 
                    ${complaint.status === 'resolved' ? 'disabled' : ''}>Mark Resolved</button>
            <button onclick="deleteComplaint('${complaint.id}')" 
                    style="background:#f44336">Delete</button>
          </div>
        </div>
      `).join("");

      container.innerHTML = html;
    }

    // Update complaint status
    function updateStatus(id, status) {
      if (db.updateComplaintStatus(id, status)) {
        displayComplaints();
        alert(`Complaint ${id} status updated to: ${status}`);
      }
    }

    // Delete complaint
    function deleteComplaint(id) {
      if (confirm(`Are you sure you want to delete complaint ${id}?`)) {
        db.deleteComplaint(id);
        displayComplaints();
        alert(`Complaint ${id} deleted successfully.`);
      }
    }

    // Database management functions
    function exportData() {
      const data = db.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `complaint_data_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('Data exported successfully!');
    }

    function importData(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(e) {
        if (db.importData(e.target.result)) {
          alert('Data imported successfully!');
          displayComplaints();
        } else {
          alert('Error importing data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }

    function clearAllData() {
      if (confirm('Are you sure you want to clear all complaint data? This action cannot be undone.')) {
        db.clearAll();
        displayComplaints();
        alert('All data cleared successfully.');
      }
    }

    function showStats() {
      const stats = db.getStats();
      const container = document.getElementById("statsContainer");
      
      let typeStats = Object.entries(stats.byType)
        .map(([type, count]) => `<li>${type}: ${count}</li>`)
        .join('');

      container.innerHTML = `
        <div style="background:#f0f8ff;padding:20px;border-radius:8px;border:1px solid #ddd;">
          <h3>Database Statistics</h3>
          <p><strong>Total Complaints:</strong> ${stats.total}</p>
          <p><strong>Registered:</strong> ${stats.registered}</p>
          <p><strong>In Progress:</strong> ${stats.inProgress}</p>
          <p><strong>Resolved:</strong> ${stats.resolved}</p>
          <h4>By Type:</h4>
          <ul>${typeStats}</ul>
        </div>
      `;
    }

    // Reveal sections on scroll
    const sections = document.querySelectorAll(".section");
    const reveal = () => {
      sections.forEach(sec => {
        const top = sec.getBoundingClientRect().top;
        if (top < window.innerHeight - 100) {
          sec.classList.add("visible");
        }
      });
    };
    window.addEventListener("scroll", reveal);
    window.addEventListener("load", reveal);

    // Auto-detect user location on load
    window.addEventListener("load", () => {
      const status = document.getElementById("locationStatus");
      const map = document.getElementById("liveMap");

      if (navigator.geolocation) {
        status.textContent = "Detecting your location...";
        navigator.geolocation.getCurrentPosition(pos => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          status.textContent = "Latitude: " + lat.toFixed(4) + ", Longitude: " + lon.toFixed(4);
          map.src = "https://www.google.com/maps?q=" + lat + "," + lon + "&z=15&output=embed";
        }, () => {
          status.style.color = "red";
          status.textContent = "Unable to fetch location. Please allow GPS access.";
        });
      } else {
        status.textContent = "Geolocation not supported in this browser.";
      }

      // Initialize complaints display
      displayComplaints();
    });
  