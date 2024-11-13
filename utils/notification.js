const User = require("../models/user.model");
const Notification = require("../models/notification.model");

const sendNotification = async (loggedInUserId, receiverId, type) => {
    const notificationSender = await User.findById(loggedInUserId);
    let text = "";
    switch (type) {
        case 'sentRequest':
            text = `${notificationSender.firstName} ${notificationSender.lastName} sent you a connection request`;
            break;
        case 'acceptedRequest':
            text = `${notificationSender.firstName} ${notificationSender.lastName} accepted your connection request`;
            break;
        case 'sharedDocument':
            text = `${notificationSender.firstName} ${notificationSender.lastName} shared a document with you`;
            break;
        default:
            break;
    }
    const notification = new Notification({
        text,
        type,
        senderId: loggedInUserId,
        receiverId
    });
    await notification.save();
    return notification;
}

const getNotifications = async (req, res) => {
    const userId = req.user.userId;
    try{
        const notifications = await Notification.find({ receiverId: userId})
        .populate('senderId', 'userId PId firstName lastName profilePicture')
        .exec();
        res.json({ success: true, notifications }); 
    } catch (error) { 
        res.status(500).json({ success: false, error: 'Error fetching notifications' });
    }
}

const markNotificationsAsRead = async (req, res) => {
    const userId = req.user.userId;
    try{
       const notifications = await Notification.updateMany({ receiverId: userId, status: 'unread' }, { status: 'read' }, { new: true }).exec();
       res.json({ success: true, notifications }); 
    } catch (error) { 
        res.status(500).json({ success: false, error: 'Error updating notifications' });
    }
}



module.exports = {
    sendNotification,
    getNotifications,
    markNotificationsAsRead
}
