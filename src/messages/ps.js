// src/messages/ps.js
import auth from "./auth/ps.json";
import common from "./common/ps.json";
import appointments from "@/messages/pages/appointments/ps.json";
import busBooking from "@/messages/pages/busBooking/ps.json";
import busBookings from "@/messages/pages/busBookings/ps.json";
import busManagementMessages from "@/messages/pages/busManagement/ps.json";
import changePasswordMessages from "@/messages/pages/changePassword/ps.json";
import cms from "@/messages/pages/cms/ps.json";
import crud from "@/messages/pages/crud/ps.json";
import documentCenter from "@/messages/pages/documentCenter/ps.json";
import dashboard from "@/messages/pages/dashboard/ps.json";
import faqs from "@/messages/pages/faqs/ps.json";
import foodTokensMessages from "@/messages/pages/food-tokens/ps.json";
import incidentReportsMessages from "@/messages/pages/incident-reports/ps.json";
import laundryBooking from "@/messages/pages/laundryBooking/ps.json";
import maintenanceRequestsMessages from "@/messages/pages/maintenance-requests/ps.json";
import manageItemsMessages from "@/messages/pages/manage-items/ps.json";
import notificationPage from "@/messages/pages/notificationPage/ps.json";
import orders from "@/messages/pages/orders/ps.json";
import orderDetailsPage from "@/messages/pages/orderDetail/ps.json";
import positionPage from "@/messages/pages/positionPage/ps.json";
import profileSetting from "@/messages/pages/profileSettings/ps.json";
import reportsAnalyticsPage from "@/messages/pages/reportsAndAnalyticsPage/ps.json";
import residentsMessages from "@/messages/pages/residents/ps.json";
import roomsHouses from "@/messages/pages/roomsHouses/ps.json";
import scheduleTimeSlots from "@/messages/pages/scheduleTimeSlots/ps.json";
import staffsMessages from "@/messages/pages/staffs/ps.json";
import timeSlots from "@/messages/pages/timeSlots/ps.json";
import visitorBooking from "@/messages/pages/visitorBooking/ps.json";
import configurationPage from "@/messages/pages/configurationCrud/ps.json";
import signInOut from "@/messages/pages/signInOut/ps.json";
import businessAdmin from "@/messages/pages/businessAdmin/ps.json";
import nationwideDashboard from "@/messages/pages/nationwideDashboard/ps.json";
import centersWeeklyReports from "@/messages/pages/centersWeeklyReports/ps.json";

const messages = {
  ...auth, // Auth related messages
  ...common, // Common messages
  ...appointments, // Appointments messages
  ...busBooking, // Bus Booking messages
  ...busBookings, // Bus Bookings messages
  ...busManagementMessages, // Bus Management messages
  ...changePasswordMessages, // Change Password messages
  ...cms, // CMS messages
  ...crud, // CRUD messages
  ...dashboard, // Dashboard messages
  ...documentCenter, // Document Center messages
  ...faqs, // FAQs messages
  ...foodTokensMessages, // Food Tokens messages
  ...incidentReportsMessages, // Incident Reports messages
  ...laundryBooking, // Laundry Booking messages
  ...maintenanceRequestsMessages, // Maintenance Requests messages
  ...manageItemsMessages, // Manage Items messages
  ...notificationPage, // Notification Page messages
  ...orders, // Orders messages
  ...orderDetailsPage, // Order Details messages
  ...positionPage, // Position Page messages
  ...profileSetting, // Profile Settings messages
  ...reportsAnalyticsPage, // Reports and Analytics messages
  ...residentsMessages, // Residents messages
  ...roomsHouses, // Rooms & Houses messages
  ...scheduleTimeSlots, // Schedule Time Slots messages
  ...staffsMessages, // Staffs messages
  ...timeSlots, // Time Slots messages
  ...visitorBooking, // Visitor Booking messages
  ...configurationPage, // Configuration Page messages
  ...signInOut, // Sign In/Out messages
  ...businessAdmin, // Business Admin messages
  ...nationwideDashboard, // Nationwide Dashboard messages
  ...centersWeeklyReports, // Centers Weekly Reports messages
};

export default messages;
