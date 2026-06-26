/**
 * AstroSyncClient - Maneja la conexión WebSocket con el servidor Node.js
 */
const AstroSyncClient = (function() {
  let socket = null;
  let currentSessionCode = null;
  let isConnected = false;

  // Referencias UI
  let btnSync, modalWrap, btnCloseSync, codeDisplay, statusDisplay;

  function init() {
    btnSync = document.getElementById('btn-sync-android');
    modalWrap = document.getElementById('sync-modal-wrap');
    btnCloseSync = document.getElementById('btn-close-sync');
    codeDisplay = document.getElementById('sync-code-display');
    statusDisplay = document.getElementById('sync-status');

    if (!btnSync) return;

    btnSync.addEventListener('click', openSyncModal);
    btnCloseSync.addEventListener('click', closeSyncModal);
  }

  function generateLocalCode() {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const digits  = '23456789';
    let code = '';
    for (let i = 0; i < 3; i++) code += letters[Math.floor(Math.random() * letters.length)];
    for (let i = 0; i < 3; i++) code += digits[Math.floor(Math.random() * digits.length)];
    return code;
  }

  function openSyncModal() {
    if (!socket) {
      connectSocket();
    }
    
    if (!currentSessionCode) {
      currentSessionCode = generateLocalCode();
      codeDisplay.textContent = currentSessionCode;
      
      if (socket && socket.connected) {
        socket.emit('join-session', { sessionCode: currentSessionCode, deviceType: 'web' });
      }
    }

    modalWrap.style.display = 'flex';
  }

  function closeSyncModal() {
    modalWrap.style.display = 'none';
  }

  function connectSocket() {
    try {
      // Conectar al servidor local (ajustar en producción)
      socket = io('http://localhost:3000', {
        reconnectionAttempts: 5,
        timeout: 10000
      });

      socket.on('connect', () => {
        console.log('[SYNC] Conectado al servidor WebSocket');
        isConnected = true;
        btnSync.style.borderColor = '#4CAF50';
        btnSync.style.color = '#4CAF50';
        
        if (currentSessionCode) {
          socket.emit('join-session', { sessionCode: currentSessionCode, deviceType: 'web' });
        }
      });

      socket.on('disconnect', () => {
        console.log('[SYNC] Desconectado del servidor');
        isConnected = false;
        btnSync.style.borderColor = 'var(--accent)';
        btnSync.style.color = 'var(--accent)';
        if (statusDisplay) statusDisplay.textContent = 'Desconectado del servidor';
      });

      socket.on('device-joined', (data) => {
        console.log('[SYNC] Dispositivo unido:', data);
        if (data.deviceType === 'android') {
          statusDisplay.textContent = '¡ANDROID CONECTADO!';
          statusDisplay.style.color = '#4CAF50';
          
          // Actualizar el botón principal
          btnSync.textContent = 'ANDROID CONECTADO ✓';
          btnSync.style.background = 'rgba(76, 175, 80, 0.1)';
          btnSync.style.borderColor = '#4CAF50';
          btnSync.style.color = '#4CAF50';
          
          showToast('Conexión con Android establecida exitosamente 📱');
          
          setTimeout(closeSyncModal, 1500); // Cerrar después de 1.5s
        }
      });

      socket.on('device-left', (data) => {
        console.log('[SYNC] Dispositivo desconectado:', data);
      });

      socket.on('phone-pointing', (data) => {
        // Podríamos actualizar la UI para mostrar adonde apunta el teléfono en tiempo real
        // console.log(`Teléfono apuntando a Az: ${data.azimuth}, Alt: ${data.altitude}`);
      });

      socket.on('aligned', (data) => {
        console.log('[SYNC] ¡Android alineado!', data);
        showToast(`¡Dispositivo alineado con ${data.object}! ✓`);
      });

    } catch (e) {
      console.error('[SYNC] Error al iniciar socket.io:', e);
    }
  }

  function setTarget(objectName, alt, az) {
    if (!socket || !isConnected) {
      alert("⚠️ AstroSync Web no está conectado al servidor local. Por favor presiona F5 para recargar la página e intenta sincronizar de nuevo.");
      return;
    }
    if (!currentSessionCode) {
      alert("⚠️ Aún no has sincronizado con Android (falta el código de sesión).");
      return;
    }
    
    console.log(`[SYNC] Enviando target: ${objectName} (Alt: ${alt.toFixed(1)}, Az: ${az.toFixed(1)})`);
    socket.emit('set-target', {
      object: objectName,
      alt: alt,
      az: az,
      sessionCode: currentSessionCode
    });
    showToast(`Coordenadas de ${objectName} enviadas al celular 📡`);
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '80px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = '#4CAF50';
    toast.style.color = '#fff';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '20px';
    toast.style.fontWeight = 'bold';
    toast.style.zIndex = '10000';
    toast.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5)';
    toast.style.transition = 'opacity 0.5s ease';
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 500);
    }, 4000);
  }

  return {
    init: init,
    setTarget: setTarget,
    isSyncActive: () => isConnected && currentSessionCode
  };
})();

// Inicializar cuando el DOM esté listo
window.addEventListener('DOMContentLoaded', () => {
  AstroSyncClient.init();
});
