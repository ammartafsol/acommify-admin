// src/messages/ka.js
import auth from "./auth/ka.json";
import common from "./common/ka.json";
import appointments from "@/messages/pages/appointments/ka.json";
import busBooking from "@/messages/pages/busBooking/ka.json";
import busBookings from "@/messages/pages/busBookings/ka.json";
import busManagementMessages from "@/messages/pages/busManagement/ka.json";
import changePasswordMessages from "@/messages/pages/changePassword/ka.json";
import cms from "@/messages/pages/cms/ka.json";
import crud from "@/messages/pages/crud/ka.json";
import documentCenter from "@/messages/pages/documentCenter/ka.json";
import dashboard from "@/messages/pages/dashboard/ka.json";
import faqs from "@/messages/pages/faqs/ka.json";
import foodTokensMessages from "@/messages/pages/food-tokens/ka.json";
import incidentReportsMessages from "@/messages/pages/incident-reports/ka.json";
import laundryBooking from "@/messages/pages/laundryBooking/ka.json";
import maintenanceRequestsMessages from "@/messages/pages/maintenance-requests/ka.json";
import manageItemsMessages from "@/messages/pages/manage-items/ka.json";
import notificationPage from "@/messages/pages/notificationPage/ka.json";
import orders from "@/messages/pages/orders/ka.json";
import orderDetailsPage from "@/messages/pages/orderDetail/ka.json";
import positionPage from "@/messages/pages/positionPage/ka.json";
import profileSetting from "@/messages/pages/profileSettings/ka.json";
import reportsAnalyticsPage from "@/messages/pages/reportsAndAnalyticsPage/ka.json";
import residentsMessages from "@/messages/pages/residents/ka.json";
import roomsHouses from "@/messages/pages/roomsHouses/ka.json";
import scheduleTimeSlots from "@/messages/pages/scheduleTimeSlots/ka.json";
import staffsMessages from "@/messages/pages/staffs/ka.json";
import timeSlots from "@/messages/pages/timeSlots/ka.json";
import visitorBooking from "@/messages/pages/visitorBooking/ka.json";
import configurationPage from "@/messages/pages/configurationCrud/ka.json";
import signInOut from "@/messages/pages/signInOut/ka.json";
import businessAdmin from "@/messages/pages/businessAdmin/ka.json";
import nationwideDashboard from "@/messages/pages/nationwideDashboard/ka.json";
import centersWeeklyReports from "@/messages/pages/centersWeeklyReports/ka.json";

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
