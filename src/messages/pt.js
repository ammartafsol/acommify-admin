// src/messages/pt.js
import auth from "./auth/pt.json";
import common from "./common/pt.json";
import appointments from "@/messages/pages/appointments/pt.json";
import busBooking from "@/messages/pages/busBooking/pt.json";
import busBookings from "@/messages/pages/busBookings/pt.json";
import busManagementMessages from "@/messages/pages/busManagement/pt.json";
import changePasswordMessages from "@/messages/pages/changePassword/pt.json";
import cms from "@/messages/pages/cms/pt.json";
import crud from "@/messages/pages/crud/pt.json";
import documentCenter from "@/messages/pages/documentCenter/pt.json";
import dashboard from "@/messages/pages/dashboard/pt.json";
import faqs from "@/messages/pages/faqs/pt.json";
import foodTokensMessages from "@/messages/pages/food-tokens/pt.json";
import incidentReportsMessages from "@/messages/pages/incident-reports/pt.json";
import laundryBooking from "@/messages/pages/laundryBooking/pt.json";
import maintenanceRequestsMessages from "@/messages/pages/maintenance-requests/pt.json";
import manageItemsMessages from "@/messages/pages/manage-items/pt.json";
import notificationPage from "@/messages/pages/notificationPage/pt.json";
import orders from "@/messages/pages/orders/pt.json";
import orderDetailsPage from "@/messages/pages/orderDetail/pt.json";
import positionPage from "@/messages/pages/positionPage/pt.json";
import profileSetting from "@/messages/pages/profileSettings/pt.json";
import reportsAnalyticsPage from "@/messages/pages/reportsAndAnalyticsPage/pt.json";
import residentsMessages from "@/messages/pages/residents/pt.json";
import roomsHouses from "@/messages/pages/roomsHouses/pt.json";
import scheduleTimeSlots from "@/messages/pages/scheduleTimeSlots/pt.json";
import staffsMessages from "@/messages/pages/staffs/pt.json";
import timeSlots from "@/messages/pages/timeSlots/pt.json";
import visitorBooking from "@/messages/pages/visitorBooking/pt.json";
import configurationPage from "@/messages/pages/configurationCrud/pt.json";
import signInOut from "@/messages/pages/signInOut/pt.json";
import businessAdmin from "@/messages/pages/businessAdmin/pt.json";
import nationwideDashboard from "@/messages/pages/nationwideDashboard/pt.json";
import centersWeeklyReports from "@/messages/pages/centersWeeklyReports/pt.json";

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
