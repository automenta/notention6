// src/ui-rewrite/NotificationBar.ts
import {useAppStore} from "../store";
import {Notification} from "../../shared/types";
import "./NotificationBar.css";

export function createNotificationBar(): HTMLElement {
    const notificationBar = document.createElement("div");
    notificationBar.className = "notification-bar";

    const renderNotifications = () => {
        const {notifications, removeNotification} = useAppStore.getState();
        notificationBar.innerHTML = ""; // Clear existing notifications

        notifications.forEach((notification: Notification) => {
            const notificationElement = document.createElement("div");
            notificationElement.className = `notification notification-${notification.type}`;
            notificationElement.setAttribute("data-id", notification.id);

            const messageElement = document.createElement("div");
            messageElement.className = "notification-message";
            messageElement.textContent = notification.message;
            notificationElement.appendChild(messageElement);

            if (notification.description) {
                const descriptionElement = document.createElement("div");
                descriptionElement.className = "notification-description";
                descriptionElement.textContent = notification.description;
                notificationElement.appendChild(descriptionElement);
            }

            const closeButton = document.createElement("button");
            closeButton.className = "notification-close-button";
            closeButton.textContent = "×";
            closeButton.onclick = () => removeNotification(notification.id);
            notificationElement.appendChild(closeButton);

            notificationBar.appendChild(notificationElement);
        });
    };

    // Subscribe to notifications changes
    useAppStore.subscribe((state) => state.notifications, renderNotifications, {
        equalityFn: (a, b) =>
            a.length === b.length && a.every((val, i) => val.id === b[i].id),
    });

    // Initial render
    renderNotifications();

    return notificationBar;
}
