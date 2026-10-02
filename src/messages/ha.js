// src/messages/ha.js
import auth from "./auth/ha.json";
import common from "./common/ha.json";
import appointments from "@/messages/pages/appointments/ha.json";
import busBooking from "@/messages/pages/busBooking/ha.json";
import busBookings from "@/messages/pages/busBookings/ha.json";
import busManagementMessages from "@/messages/pages/busManagement/ha.json";
import changePasswordMessages from "@/messages/pages/changePassword/ha.json";
import cms from "@/messages/pages/cms/ha.json";
import crud from "@/messages/pages/crud/ha.json";
import documentCenter from "@/messages/pages/documentCenter/ha.json";
import dashboard from "@/messages/pages/dashboard/ha.json";
import faqs from "@/messages/pages/faqs/ha.json";
import foodTokensMessages from "@/messages/pages/food-tokens/ha.json";
import incidentReportsMessages from "@/messages/pages/incident-reports/ha.json";
import laundryBooking from "@/messages/pages/laundryBooking/ha.json";
import maintenanceRequestsMessages from "@/messages/pages/maintenance-requests/ha.json";
import manageItemsMessages from "@/messages/pages/manage-items/ha.json";
import notificationPage from "@/messages/pages/notificationPage/ha.json";
import orders from "@/messages/pages/orders/ha.json";
import orderDetailsPage from "@/messages/pages/orderDetail/ha.json";
import positionPage from "@/messages/pages/positionPage/ha.json";
import profileSetting from "@/messages/pages/profileSettings/ha.json";
import reportsAnalyticsPage from "@/messages/pages/reportsAndAnalyticsPage/ha.json";
import residentsMessages from "@/messages/pages/residents/ha.json";
import roomsHouses from "@/messages/pages/roomsHouses/ha.json";
import scheduleTimeSlots from "@/messages/pages/scheduleTimeSlots/ha.json";
import staffsMessages from "@/messages/pages/staffs/ha.json";
import timeSlots from "@/messages/pages/timeSlots/ha.json";
import visitorBooking from "@/messages/pages/visitorBooking/ha.json";
import configurationPage from "@/messages/pages/configurationCrud/ha.json";
import signInOut from "@/messages/pages/signInOut/ha.json";
import businessAdmin from "@/messages/pages/businessAdmin/ha.json";
import nationwideDashboard from "@/messages/pages/nationwideDashboard/ha.json";
import centersWeeklyReports from "@/messages/pages/centersWeeklyReports/ha.json";

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
