jest.mock('../../models', () => ({
  Notification: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
  },
  User: {}
}));

const { Notification } = require('../../models');
const NotificationService = require('../../services/NotificationService');

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getUserNotifications returns count and data', async () => {
    Notification.findAndCountAll.mockResolvedValue({
      count: 2,
      rows: [{ id: 1, isRead: false }, { id: 2, isRead: true }]
    });

    const result = await NotificationService.getUserNotifications(5, { limit: 10, offset: 0 });

    expect(result).toEqual({ total: 2, data: [{ id: 1, isRead: false }, { id: 2, isRead: true }] });
    expect(Notification.findAndCountAll).toHaveBeenCalled();
  });

  test('createNotification creates and returns notification', async () => {
    const mockNotif = { id: 1, title: 'Test', message: 'Message', recipientId: 5 };
    Notification.create.mockResolvedValue(mockNotif);

    const result = await NotificationService.createNotification(5, { title: 'Test', message: 'Message' });

    expect(result).toEqual(mockNotif);
    expect(Notification.create).toHaveBeenCalled();
  });

  test('getNotificationById returns notification with recipient', async () => {
    const mockNotif = { id: 1, title: 'Test', recipientId: 5, toJSON: () => ({ id: 1, title: 'Test' }) };
    Notification.findByPk.mockResolvedValue(mockNotif);

    const result = await NotificationService.getNotificationById(1);

    expect(result).toEqual(mockNotif);
  });

  test('markAsRead updates notification with timestamp', async () => {
    const mockNotif = { id: 1, isRead: false, update: jest.fn() };
    Notification.findByPk.mockResolvedValue(mockNotif);

    await NotificationService.markAsRead(1);

    const updateCall = mockNotif.update.mock.calls[0][0];
    expect(updateCall.isRead).toBe(true);
    expect(updateCall.readAt).toBeDefined();
  });

  test('deleteNotification destroys notification', async () => {
    const mockNotif = { id: 1, destroy: jest.fn() };
    Notification.findByPk.mockResolvedValue(mockNotif);

    await NotificationService.deleteNotification(1);

    expect(mockNotif.destroy).toHaveBeenCalled();
  });
});
