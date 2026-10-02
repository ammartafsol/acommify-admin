export const allPermissions = [
  "view-dashboard",
  "view-accommodation-checkin-checkout-logs",
  "view-business-owner",
  "add-edit-business-owner",
  "view-staff",
  "add-edit-staff",
  "view-positions",
  "add-edit-position",
  "view-residents",
  "add-edit-resident",
  "view-food-tokens",
  "add-food-token",
  "view-incident-reports",
  "add-incident-report",
  "view-reports-and-analytics",
  "view-laundry-bookings",
  "update-laundry-booking-status",
  "view-bus-bookings",
  "add-edit-bus-bookings",
  "view-staff-bookings",
  "update-staff-booking-status",
  "view-maintenance-requests",
  "approve-reject-maintenance-request",
  "view-products",
  "view-product-categories",
  "add-edit-product",
  "add-edit-product-category",
  "view-documents",
  "add-edit-document",
  "view-accommodations",
  "add-edit-accommodation",
  "view-machines",
  "add-edit-machine",
  "view-help-lines",
  "add-edit-help-line",
  "view-buses",
  "add-edit-bus",
  "view-faqs",
  "add-edit-faq",
  "view-maintenance-request-categories",
  "add-edit-maintenance-request-category",
  "view-orders",
  "edit-order",
  "view-notifications",
  "view-app-configs",
  "edit-app-configs",
  "see-appointments-slots",
  "see-laundry-slots",
  "see-visitor-slots",
  "view-visitor-bookings",
  "update-visitor-booking-status",
  "view-cms",
  "edit-cms",
];

export const permissionsList = [
  {
    label: "dashboard",
    permissions: ["view-dashboard"],
    children: [],
    dependencies: [],
  },
  {
    label: "staff",
    permissions: ["view-staff", "add-edit-staff"],
    removeList: ["see-appointments-slots", "add-incident-report"],
    children: [
      {
        label: "view-staff",
        permissions: ["view-staff"],
        dependencies: [],
        removeList: [
          "add-edit-staff",
          "see-appointments-slots",
          "add-incident-report",
        ],
      },
      {
        label: "add-edit-staff",
        permissions: ["add-edit-staff"],
        dependencies: ["view-staff", "view-positions"],
      },
    ],
    dependencies: ["view-positions"],
  },
  {
    label: "positions",
    permissions: ["view-positions", "add-edit-position"],
    removeList: ["add-edit-staff"],
    children: [
      {
        label: "view-positions",
        permissions: ["view-positions"],
        dependencies: [],
        removeList: ["add-edit-position", "add-edit-staff"],
      },
      {
        label: "add-edit-position",
        permissions: ["add-edit-position"],
        dependencies: ["view-positions"],
      },
    ],
    dependencies: [],
  },
  {
    label: "residents",
    permissions: ["view-residents", "add-edit-resident"],
    removeList: [
      "add-food-token",
      "add-incident-report",
      "view-accommodation-checkin-checkout-logs",
    ],
    children: [
      {
        label: "view-residents",
        permissions: ["view-residents"],
        dependencies: ["view-accommodations"],
        removeList: [
          "add-edit-resident",
          "add-food-token",
          "add-incident-report",
          "view-accommodation-checkin-checkout-logs",
        ],
      },
      {
        label: "add-edit-resident",
        permissions: ["add-edit-resident"],
        dependencies: ["view-residents", ""],
      },
    ],
    dependencies: [],
  },
  {
    label: "view-accommodation-checkin-checkout-logs",
    permissions: ["view-accommodation-checkin-checkout-logs"],
    children: [],
    dependencies: ["view-residents"],
  },
  {
    label: "food-tokens",
    permissions: ["view-food-tokens", "add-food-token"],
    children: [
      {
        label: "view-food-tokens",
        permissions: ["view-food-tokens"],
        dependencies: [],
        removeList: ["add-food-token"],
      },
      {
        label: "add-food-token",
        permissions: ["add-food-token"],
        dependencies: ["view-food-tokens", "view-residents"],
      },
    ],
    dependencies: ["view-residents"],
  },
  {
    label: "incident-reports",
    permissions: ["view-incident-reports", "add-incident-report"],
    children: [
      {
        label: "view-incident-reports",
        permissions: ["view-incident-reports"],
        dependencies: [],
        removeList: ["add-incident-report"],
      },
      {
        label: "add-incident-report",
        permissions: ["add-incident-report"],
        dependencies: ["view-incident-reports", "view-residents", "view-staff"],
      },
    ],
    dependencies: ["view-residents", "view-staff"],
  },
  {
    label: "reports-analytics",
    permissions: ["view-reports-and-analytics"],
    children: [],
    dependencies: [],
  },
  {
    label: "laundry-bookings",
    permissions: ["view-laundry-bookings", "update-laundry-booking-status"],
    children: [
      {
        label: "view-laundry-bookings",
        permissions: ["view-laundry-bookings"],
        dependencies: [],
        removeList: ["update-laundry-booking-status"],
      },
      {
        label: "update-laundry-booking-status",
        permissions: ["update-laundry-booking-status"],
        dependencies: ["view-laundry-bookings"],
      },
    ],
    dependencies: [],
  },
  {
    label: "bus-bookings",
    permissions: ["view-bus-bookings", "add-edit-bus-bookings"],
    children: [
      {
        label: "view-bus-bookings",
        permissions: ["view-bus-bookings"],
        dependencies: [],
        removeList: ["add-edit-bus-bookings"],
      },
      {
        label: "add-edit-bus-bookings",
        permissions: ["add-edit-bus-bookings"],
        dependencies: ["view-bus-bookings"],
      },
    ],
    dependencies: [],
  },
  {
    label: "staff-bookings",
    permissions: ["view-staff-bookings", "update-staff-booking-status"],
    children: [
      {
        label: "view-staff-bookings",
        permissions: ["view-staff-bookings"],
        dependencies: [],
        removeList: ["update-staff-booking-status"],
      },
      {
        label: "update-staff-booking-status",
        permissions: ["update-staff-booking-status"],
        dependencies: ["view-staff-bookings"],
      },
    ],
    dependencies: [],
  },
  {
    label: "maintenance-requests",
    permissions: [
      "view-maintenance-requests",
      "approve-reject-maintenance-request",
    ],
    children: [
      {
        label: "view-maintenance-requests",
        permissions: ["view-maintenance-requests"],
        dependencies: [],
        removeList: ["approve-reject-maintenance-request"],
      },
      {
        label: "approve-reject-maintenance-request",
        permissions: ["approve-reject-maintenance-request"],
        dependencies: ["view-maintenance-requests"],
      },
    ],
    dependencies: [],
  },
  {
    label: "manage-products",
    permissions: [
      "view-products",
      "view-product-categories",
      "add-edit-product",
      "add-edit-product-category",
    ],
    children: [
      {
        label: "view-products",
        permissions: ["view-products", "view-product-categories"],
        dependencies: [],
        removeList: ["add-edit-product", "add-edit-product-category"],
      },
      {
        label: "add-edit-product",
        permissions: ["add-edit-product", "add-edit-product-category"],
        dependencies: ["view-products", "view-product-categories"],
      },
    ],
    dependencies: [],
  },
  {
    label: "document-center",
    permissions: ["view-documents", "add-edit-document"],
    children: [
      {
        label: "view-documents",
        permissions: ["view-documents"],
        dependencies: [],
        removeList: ["add-edit-document"],
      },
      {
        label: "add-edit-document",
        permissions: ["add-edit-document"],
        dependencies: ["view-documents"],
      },
    ],
    dependencies: [],
  },
  {
    label: "accommodations",
    permissions: ["view-accommodations", "add-edit-accommodation"],
    removeList: ["see-visitor-slots", "view-residents"],
    children: [
      {
        label: "view-accommodations",
        permissions: ["view-accommodations"],
        dependencies: [],
        removeList: [
          "add-edit-accommodation",
          "see-visitor-slots",
          "view-residents",
        ],
      },
      {
        label: "add-edit-accommodation",
        permissions: ["add-edit-accommodation"],
        dependencies: ["view-accommodations"],
      },
    ],
    dependencies: [],
  },
  {
    label: "laundry-machines",
    permissions: ["view-machines", "add-edit-machine"],
    removeList: ["see-laundry-slots"],
    children: [
      {
        label: "view-machines",
        permissions: ["view-machines"],
        dependencies: [],
        removeList: ["add-edit-machine", "see-laundry-slots"],
      },
      {
        label: "add-edit-machine",
        permissions: ["add-edit-machine"],
        dependencies: ["view-machines"],
      },
    ],
    dependencies: [],
  },
  {
    label: "help-lines",
    permissions: ["view-help-lines", "add-edit-help-line"],
    children: [
      {
        label: "view-help-lines",
        permissions: ["view-help-lines"],
        dependencies: [],
        removeList: ["add-edit-help-line"],
      },
      {
        label: "add-edit-help-line",
        permissions: ["add-edit-help-line"],
        dependencies: ["view-help-lines"],
      },
    ],
    dependencies: [],
  },
  {
    label: "bus-management",
    permissions: ["view-buses", "add-edit-bus"],
    children: [
      {
        label: "view-buses",
        permissions: ["view-buses"],
        dependencies: [],
        removeList: ["add-edit-bus"],
      },
      {
        label: "add-edit-bus",
        permissions: ["add-edit-bus"],
        dependencies: ["view-buses"],
      },
    ],
    dependencies: [],
  },
  {
    label: "faqs",
    permissions: ["view-faqs", "add-edit-faq"],
    children: [
      {
        label: "view-faqs",
        permissions: ["view-faqs"],
        dependencies: [],
        removeList: ["add-edit-faq"],
      },
      {
        label: "add-edit-faq",
        permissions: ["add-edit-faq"],
        dependencies: ["view-faqs"],
      },
    ],
    dependencies: [],
  },
  {
    label: "maintenance-categories",
    permissions: [
      "view-maintenance-request-categories",
      "add-edit-maintenance-request-category",
    ],
    children: [
      {
        label: "view-maintenance-request-categories",
        permissions: ["view-maintenance-request-categories"],
        dependencies: [],
        removeList: ["add-edit-maintenance-request-category"],
      },
      {
        label: "add-edit-maintenance-request-category",
        permissions: ["add-edit-maintenance-request-category"],
        dependencies: ["view-maintenance-request-categories"],
      },
    ],
    dependencies: [],
  },
  {
    label: "order-management",
    permissions: ["view-orders", "edit-order"],
    children: [
      {
        label: "view-orders",
        permissions: ["view-orders"],
        dependencies: [],
        removeList: ["edit-order"],
      },
      {
        label: "edit-order",
        permissions: ["edit-order"],
        dependencies: ["view-orders"],
      },
    ],
    dependencies: [],
  },
  {
    label: "notifications",
    permissions: ["view-notifications"],
    children: [],
    dependencies: [],
  },
  {
    label: "appointment-slots",
    permissions: ["see-appointments-slots"],
    children: [],
    dependencies: ["view-staff"],
  },
  {
    label: "laundry-slots",
    permissions: ["see-laundry-slots"],
    children: [],
    dependencies: ["view-machines"],
  },
  {
    label: "visitor-slots",
    permissions: ["see-visitor-slots"],
    children: [],
    dependencies: ["view-accommodations"],
  },
  {
    label: "visitor-bookings",
    permissions: ["view-visitor-bookings", "update-visitor-booking-status"],
    children: [
      {
        label: "view-visitor-bookings",
        permissions: ["view-visitor-bookings"],
        dependencies: [],
        removeList: ["update-visitor-booking-status"],
      },
      {
        label: "update-visitor-booking-status",
        permissions: ["update-visitor-booking-status"],
        dependencies: ["view-visitor-bookings"],
      },
    ],
    dependencies: [],
  },
  // {
  //   label: "app-configs",
  //   permissions: ["view-app-configs", "edit-app-configs"],
  //   children: [
  //     {
  //       label: "view-app-configs",
  //       permissions: ["view-app-configs"],
  //       dependencies: [],
  //       removeList: ["edit-app-configs"],
  //     },
  //     {
  //       label: "edit-app-configs",
  //       permissions: ["edit-app-configs"],
  //       dependencies: ["view-app-configs"],
  //     },
  //   ],
  //   dependencies: [],
  // },
  // {
  //   label: "cms",
  //   permissions: ["view-cms", "edit-cms"],
  //   children: [
  //     {
  //       label: "view-cms",
  //       permissions: ["view-cms"],
  //       dependencies: [],
  //       removeList: ["edit-cms"],
  //     },
  //     {
  //       label: "edit-cms",
  //       permissions: ["edit-cms"],
  //       dependencies: ["view-cms"],
  //     },
  //   ],
  //   dependencies: [],
  // },
];
