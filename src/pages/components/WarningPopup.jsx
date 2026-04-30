import React from 'react';
import '../../App.css'

function WarningPopup(params){
    return <div className="modern-card">
            {params.message}
        </div>
}

export default WarningPopup;