import { useRef, useEffect } from 'react';
import '../App.css';

function HelpModal({ title, children, id = "helpDialog" }) {
  const dialogRef = useRef(null);

  // Fallback for browsers without 'closedby' support
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const handleClick = (event) => {
        if (event.target !== dialog) return;

        const rect = dialog.getBoundingClientRect();
        const isDialogContent = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );

        if (isDialogContent) return;
        dialog.close();
      };
      
      dialog.addEventListener('click', handleClick);
      return () => dialog.removeEventListener('click', handleClick);
    }
  }, []);

  const openDialog = () => {
    dialogRef.current?.showModal();
  };

  const closeDialog = () => {
    dialogRef.current?.close();
  };

  return (
    <>
      <button 
        className="help-btn" 
        onClick={openDialog}
        aria-label={`Help for ${title}`}
        title="How to use this tool"
      >
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      <dialog 
        ref={dialogRef} 
        id={id} 
        className="glass-dialog" 
        closedby="any" 
        aria-labelledby={`${id}-title`}
      >
        <div className="glass-dialog-header">
          <h2 id={`${id}-title`} className="glass-dialog-title">{title}</h2>
          <button className="glass-dialog-close" onClick={closeDialog} aria-label="Close dialog">
            &times;
          </button>
        </div>
        <div className="glass-dialog-content" style={{ textAlign: 'left', lineHeight: '1.6', color: '#1a1209' }}>
          {children}
        </div>
      </dialog>
    </>
  );
}

export default HelpModal;
