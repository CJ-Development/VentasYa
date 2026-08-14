import { createContext, useContext, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
import "./NotificationProvider.css";

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotification must be used within NotificationProvider");
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const showNotification = ({ type = "info", message, duration = 4000 }) => {
        const id = Date.now();
        const notification = { id, type, message };

        setNotifications((prev) => [...prev, notification]);

        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }

        return id;
    };

    const removeNotification = (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const success = (message, duration) => showNotification({ type: "success", message, duration });
    const error = (message, duration) => showNotification({ type: "error", message, duration });
    const warning = (message, duration) => showNotification({ type: "warning", message, duration });
    const info = (message, duration) => showNotification({ type: "info", message, duration });

    return (
        <NotificationContext.Provider value={{ showNotification, success, error, warning, info }}>
            {children}
            <div className="notifications-container">
                {notifications.map((notification) => (
                    <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onClose={() => removeNotification(notification.id)}
                    />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

const NotificationItem = ({ notification, onClose }) => {
    const icons = {
        success: <CheckCircle size={20} />,
        error: <XCircle size={20} />,
        warning: <AlertCircle size={20} />,
        info: <Info size={20} />,
    };

    return (
        <div className={`notification notification-${notification.type}`}>
            <div className="notification-icon">
                {icons[notification.type]}
            </div>
            <div className="notification-content">
                <span className="notification-message">{notification.message}</span>
            </div>
            <button
                className="notification-close"
                onClick={onClose}
                aria-label="Cerrar"
            >
                <X size={16} />
            </button>
        </div>
    );
};
