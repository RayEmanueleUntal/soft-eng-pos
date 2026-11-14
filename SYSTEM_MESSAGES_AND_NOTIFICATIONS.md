# System Messages and Notifications Inventory

This document lists all user-facing system messages and notifications (errors and successes) found across the POS application codebase.

**Columns:** 1. Message Type | 2. Meaning | 3. Recommended Action | 4. Page Found In | 5. How to Reproduce

Within each functional area, user-facing errors, validation messages, and success notifications are listed first, followed by backend/API failures at the bottom.

---

## Authentication

### User Errors, Validation & Success

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Unable to sign in. Please try again. | Generic sign-in failure due to incorrect credentials | Check connection, verify credentials, retry | Login Page (`app/auth/login/_components/LoginForm.tsx`) | Enter incorrect username or password |

### Backend / API Failures

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| No access token returned | Sign-in API responded without an access token | Check credentials and try again | Login Page (`app/auth/login/_components/LoginForm.tsx`) | Backend returns response without `access_token` field |
| Failed to create session | Session cookie could not be set after sign-in | Try signing in again | Login Page (`app/auth/login/_components/LoginForm.tsx`) | `/api/auth/session` returns non-OK status |
| (Backend-specific message from API response) | Backend returned a specific error message | Read and follow the displayed message | Login Page (`app/auth/login/_components/LoginForm.tsx`) | Backend rejects credentials with a message in `response.data.message` |
| Authentication required. Please log in to continue. | HTTP 401 – session expired or missing | Log in again | `lib/utils.ts` (`getErrorMessage`) – global | API request with expired or missing JWT token |
| Access denied. You do not have permission to view or perform this action. | HTTP 403 – insufficient role | Contact an administrator | `lib/utils.ts` (`getErrorMessage`) – global | Admin-only action attempted by lower-privilege user |
| Unable to connect to server. Please check if the backend is running. | Network error (ERR_NETWORK) | Verify backend server is running | `lib/utils.ts` (`getErrorMessage`) – global | Backend disconnected, any API call attempted |
---

## Suppliers Page

### User Errors, Validation & Success

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Company name is required | Company name field is empty | Enter a company name | Supplier Modal (`app/dashboard/suppliers/_components/SupplierModal.tsx`) | Submit with empty company name |
| Address is required | Address field is empty | Enter an address | Supplier Modal (`app/dashboard/suppliers/_components/SupplierModal.tsx`) | Submit with empty address |
| Invalid email format | Email is not a valid email address | Enter a properly formatted email | Supplier Modal (`app/dashboard/suppliers/_components/SupplierModal.tsx`) | Enter email missing `@` or domain |
| Lead time cannot be negative | Lead time days is less than 0 | Enter a non-negative number | Supplier Modal (`app/dashboard/suppliers/_components/SupplierModal.tsx`) | Enter negative lead time value |
| Supplier updated successfully. | Existing supplier details saved | None | Suppliers Page (`app/dashboard/suppliers/_components/SupplierTable.tsx`, `handleCreateOrUpdate`) | Edit a supplier in the modal and save |
| Supplier created successfully. | New supplier created | None | Suppliers Page (`app/dashboard/suppliers/_components/SupplierTable.tsx`, `handleCreateOrUpdate`) | Add a new supplier in the modal and save |
| (Backend message) or Supplier processed successfully. | Supplier deleted; backend may provide custom message | None | Suppliers Page (`app/dashboard/suppliers/_components/SupplierTable.tsx`, `handleDelete`) | Delete a supplier from the dropdown menu |

### Backend / API Failures

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Failed to load suppliers. | Supplier list could not be fetched | Retry / refresh; check connection | Suppliers Page (`app/dashboard/suppliers/_components/SupplierTable.tsx`, `loadData`) | `GET /suppliers` endpoint fails |

---

## System Settings Page (Admin)

### User Errors, Validation & Success

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Key is required. | Setting key field is empty | Enter a key | Setting Form Dialog (`app/dashboard/admin/system-settings/_components/SettingFormDialog.tsx`, `validate`) | Submit with empty key |
| Key must use uppercase letters, numbers, and underscores, for example RETURN_WINDOW_DAYS. | Key does not match pattern `^[A-Z][A-Z0-9_]*$` | Use uppercase letters, numbers, underscores only | Setting Form Dialog (`app/dashboard/admin/system-settings/_components/SettingFormDialog.tsx`, `validate`) | Enter key with lowercase, spaces, or special chars |
| Value is required. | Setting value field is empty | Enter a value | Setting Form Dialog (`app/dashboard/admin/system-settings/_components/SettingFormDialog.tsx`, `validate`) | Submit with empty value |
| Setting "<key>" created. | New system setting was saved | None | System Settings Table (`app/dashboard/admin/system-settings/_components/SystemSettingsTable.tsx`, `handleSaved`) | Add Setting, enter valid key/value, save |
| Setting "<key>" updated. | Existing system setting was modified | None | System Settings Table (`app/dashboard/admin/system-settings/_components/SystemSettingsTable.tsx`, `handleSaved`) | Edit Setting, change value, save |
| Setting "<key>" deleted. | System setting was removed | None | System Settings Table (`app/dashboard/admin/system-settings/_components/SystemSettingsTable.tsx`, `handleDeleted`) | Delete a setting from the table |
| This key is a live business rule. Deleting it can change how returns, tax, pricing, or receipts behave across the store. This cannot be undone. | Warning: setting is a core business-rule key | Confirm carefully; deletion is irreversible | Delete Setting Dialog (`app/dashboard/admin/system-settings/_components/DeleteSettingDialog.tsx`) | Delete a core setting (e.g., TAX_RATE_PERCENT) |
| This removes the setting permanently. This cannot be undone. | Warning: standard setting deletion notice | Confirm carefully | Delete Setting Dialog (`app/dashboard/admin/system-settings/_components/DeleteSettingDialog.tsx`) | Delete a non-core setting |

### Backend / API Failures

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Failed to load system settings. | Settings list could not be fetched | Refresh and try again | System Settings Table (`app/dashboard/admin/system-settings/_components/SystemSettingsTable.tsx`, `loadSettings`) | `GET /system-settings` endpoint fails |
| Failed to load this setting. | Individual setting could not be loaded for editing (often 404) | Refresh and try again | System Settings Table (`app/dashboard/admin/system-settings/_components/SystemSettingsTable.tsx`, `handleEdit`) | Edit a setting that was deleted |
| Failed to save the setting. | Create/update API call failed | Try again; check connection | Setting Form Dialog (`app/dashboard/admin/system-settings/_components/SettingFormDialog.tsx`, `handleSubmit` catch) | `POST/PATCH /system-settings` endpoint fails |
| Cannot reach the server. Check your connection and try again. | API is unreachable (no response) | Verify backend is running | `lib/admin/system-settings.ts` (`toSettingError`) | Backend disconnected, settings operation attempted |
| The request could not be saved. Please try again. | HTTP 400 – request was invalid | Check the input values and try again | `lib/admin/system-settings.ts` (`toSettingError`) | Submit invalid data to settings API |
| You do not have permission to change system settings. | HTTP 403 – insufficient role | Contact an administrator | `lib/admin/system-settings.ts` (`toSettingError`) | Change settings as non-admin user |
| This setting no longer exists. Refresh and try again. | HTTP 404 – setting was deleted | Refresh the page | `lib/admin/system-settings.ts` (`toSettingError`) | Edit/delete a setting removed by another user |
| A setting with this key already exists. | HTTP 409 – duplicate key | Use a different key | `lib/admin/system-settings.ts` (`toSettingError`) | Create setting with existing key |
| Failed to delete the setting. | Delete API call failed | Try again | Delete Setting Dialog (`app/dashboard/admin/system-settings/_components/DeleteSettingDialog.tsx`, `handleDelete`) | `DELETE /system-settings/{key}` endpoint fails |

---

## Forwarders Page (Logistics)

### User Errors, Validation & Success

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Company Name and Contact Info are required. | One or both required fields left empty | Enter company name and tracking contact info | Create Forwarder Modal (`app/dashboard/forwarders/_components/CreateForwarderModal.tsx`) | Submit form with empty company name or contact info |
| Forwarder updated successfully. | Existing forwarder details saved | None | Forwarders Page (`app/dashboard/forwarders/page.tsx`, `EditForwarderModal`) | Edit a forwarder in the modal and save |
| Forwarder created successfully. | New forwarder added | None | Forwarders Page (`app/dashboard/forwarders/page.tsx`, `CreateForwarderModal`) | Add a new forwarder in the modal and save |
| Forwarder deleted successfully. | Forwarder removed from the list | None | Forwarders Page (`app/dashboard/forwarders/page.tsx`, `DeleteForwarderModal`) | Delete a forwarder from the table |

### Backend / API Failures

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Failed to load forwarders. | Forwarder list could not be fetched | Retry / refresh; check connection | Forwarders Page (`app/dashboard/forwarders/page.tsx`) | `GET /forwarders` endpoint fails |
| Failed to create forwarder. | Create API call failed | Try again; check backend message | Create Forwarder Modal (`app/dashboard/forwarders/_components/CreateForwarderModal.tsx`, `handleSubmit` catch) | `POST /forwarders` endpoint fails |
| Failed to update forwarder. | Update API call failed | Try again; check backend message | Edit Forwarder Modal (`app/dashboard/forwarders/_components/EditForwarderModal.tsx`, `handleSubmit` catch) | `PATCH /forwarders/{id}` endpoint fails |
| Failed to delete forwarder. | Delete API call failed | Try again; check backend message | Delete Forwarder Modal (`app/dashboard/forwarders/_components/DeleteForwarderModal.tsx`, `handleDelete` catch) | `DELETE /forwarders/{id}` endpoint fails |

---

## Approval Requests Page (Admin)

### User Errors, Validation & Success

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| An error occurred while processing your request. | Approve or reject API call failed; error message returned by backend | Review the error message and try again | Approval Requests Page (`app/dashboard/admin/approval-requests/page.tsx`, `handleConfirmApprove` / `handleConfirmReject`) | Collapse a request, then confirm approve or reject when backend rejects |

### Backend / API Failures

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Failed to load approval requests. | Approval requests list could not be fetched | Refresh / retry; check connection | Approval Requests Page (`app/dashboard/admin/approval-requests/page.tsx`) | `GET /approval` endpoint fails |
| Failed to approve request. | Approve API call failed | Try again; check backend message | Approval Requests Page (`app/dashboard/admin/approval-requests/page.tsx`, `handleConfirmApprove`) | Click Approve when backend rejects |
| Failed to reject request. | Reject API call failed | Try again; check backend message | Approval Requests Page (`app/dashboard/admin/approval-requests/page.tsx`, `handleConfirmReject`) | Click Reject when backend rejects |

---

## Staff Page

### User Errors, Validation & Success

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Username is required. | Username field is empty | Enter a username | Add Staff Modal (`app/dashboard/staff/_components/AddStaffModal.tsx`) | Submit with empty username |
| First name is required. | First name field is empty | Enter a first name | Add Staff Modal (`app/dashboard/staff/_components/AddStaffModal.tsx`) | Submit with empty first name |
| Last name is required. | Last name field is empty | Enter a last name | Add Staff Modal (`app/dashboard/staff/_components/AddStaffModal.tsx`) | Submit with empty last name |
| Password is required and must be at least 6 characters long. | New staff missing valid password | Enter password of 6+ characters | Add Staff Modal (`app/dashboard/staff/_components/AddStaffModal.tsx`) | Submit add form without password or with short one |
| New password must be at least 6 characters long. | Edited staff password is too short | Enter password of 6+ characters | Add Staff Modal (`app/dashboard/staff/_components/AddStaffModal.tsx`) | Enter password shorter than 6 when editing |
| (Success banner from `successMessage` state) | Staff member created, updated, or status toggled | None | Staff Table (`app/dashboard/staff/_components/StaffTable.tsx`) | Save a staff member or toggle active/inactive status |

### Backend / API Failures

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| (Error banner from `error` state) | Staff list load or save failure | Refresh and try again | Staff Table (`app/dashboard/staff/_components/StaffTable.tsx`) | `GET /staff-users` endpoint fails |
| Failed to save staff member. | Save API call failed | Try again; check backend message | Add Staff Modal (`app/dashboard/staff/_components/AddStaffModal.tsx`, `handleSubmit` catch) | `POST/PATCH /staff-users` endpoint fails |

---

## POS Page (Sales Terminal)

### User Errors, Validation & Success

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Last transaction (<invoice_number>) completed successfully! | A checkout/sale was completed successfully | None – print or start a new sale | POS Page (`app/dashboard/pos/page.tsx`, success banner) | Complete a sale through the Payment Modal |
| Hold function activated | The hold shortcut key was pressed | None – informational | POS Page (`app/dashboard/pos/page.tsx`, `usePosShortcuts`) | Press the hold hotkey |
| Hold function activated | The hold button in the command bar was clicked | None – informational | POS Command Bar (`app/dashboard/pos/_components/PosCommandBar.tsx`) | Click the Hold button |

### Backend / API Failures

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| (none) | | | | |

---

## POS – Payment Modal

### User Errors, Validation & Success

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Amount to apply must be between ₱0.01 and ₱X. | Cash amount is invalid (zero, negative, or exceeds due) | Enter a valid amount | Cash Payment Form (`app/dashboard/pos/_components/payment/CashPaymentForm.tsx`) | Enter 0, negative, or more than amount due |
| Insufficient cash tendered. | Cash tendered is less than amount to apply | Tender more cash | Cash Payment Form (`app/dashboard/pos/_components/payment/CashPaymentForm.tsx`) | Enter tendered amount less than amount to apply |
| Valid GCash payment amount is required. | GCash amount is missing or invalid | Enter a positive amount | GCash Payment Form (`app/dashboard/pos/_components/payment/GCashPaymentForm.tsx`) | Leave amount empty or enter 0/negative |
| GCash payment cannot exceed remaining due (₱X). | GCash amount exceeds remaining balance | Reduce the amount | GCash Payment Form (`app/dashboard/pos/_components/payment/GCashPaymentForm.tsx`) | Enter amount greater than remaining due |
| GCash Reference Number is required (at least 6 digits). | Reference number is too short | Enter at least 6 characters | GCash Payment Form (`app/dashboard/pos/_components/payment/GCashPaymentForm.tsx`) | Enter fewer than 6 characters in reference field |
| A valid 11-digit GCash mobile number (09XXXXXXXXX) is required. | Mobile number format is invalid | Enter an 11-digit number starting with 09 | GCash Payment Form (`app/dashboard/pos/_components/payment/GCashPaymentForm.tsx`) | Enter invalid mobile number |
| Note: Entered amount is less than total due (₱X). | GCash amount is less than total (split payment) | Add another payment method for remainder | GCash Payment Form (`app/dashboard/pos/_components/payment/GCashPaymentForm.tsx`) | Enter partial GCash amount |
| Reference Number is required (min 6 alphanumeric characters). | Reference validation (after blur) | Enter a valid reference | GCash Payment Form (`app/dashboard/pos/_components/payment/GCashPaymentForm.tsx`) | Leave reference field invalid after touching it |
| Enter a valid 11-digit mobile number starting with 09. | Mobile validation (after blur) | Enter a valid number | GCash Payment Form (`app/dashboard/pos/_components/payment/GCashPaymentForm.tsx`) | Leave mobile field invalid after touching it |
| This account has been flagged as inactive. Contact the manager or finance team to reactivate. | Wholesale customer's credit account is inactive | Contact manager/finance team | Credit Payment Form (`app/dashboard/pos/_components/payment/CreditPaymentForm.tsx`) | Select a customer whose account is inactive |
| Sale exceeds available credit by ₱X. Requires manager override or partial payment. | Credit sale exceeds customer's available credit | Use manager override or pay partially | Credit Payment Form (`app/dashboard/pos/_components/payment/CreditPaymentForm.tsx`) | Attempt credit sale exceeding available credit |

### Backend / API Failures

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Failed to process checkout. | Checkout/sale submission failed | Try again; check backend error | `lib/pos/services/pos-api.ts` (`submitCheckout`) | Submit checkout when backend returns error |

---

## POS – Receipt / Transaction History

### User Errors, Validation & Success

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| (none) | | | | |

### Backend / API Failures

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Failed to load transaction history | Transaction list could not be fetched | Refresh and try again | Transaction History Page (`app/dashboard/pos/receipt/page.tsx`, `handleRefresh`) | `GET /transactions` endpoint fails |
| (Receipt not found / backend error) | Requested receipt could not be retrieved | Verify receipt ID and try again | Receipt Detail Page (`app/dashboard/pos/receipt/[id]/page.tsx`, `error` state) | Open a receipt with invalid/non-existent ID |

---

## POS – Refund / Exchange Modals

### User Errors, Validation & Success

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Please select an item to return. | No receipt item was selected | Select an item from the list | Refund Modal (`app/dashboard/pos/receipt/[id]/_components/return/RefundModal.tsx`, `handleSubmit`) | Click Submit Refund without choosing an item |
| Quantity must be greater than 0. | Return quantity is zero or negative | Enter a positive quantity | Refund Modal (`app/dashboard/pos/receipt/[id]/_components/return/RefundModal.tsx`, `handleSubmit`) | Enter 0 or negative quantity |
| This item has already been fully returned. | Returnable quantity is 0 | Choose a different item | Refund Modal (`app/dashboard/pos/receipt/[id]/_components/return/RefundModal.tsx`, `handleSubmit`) | Return an item already fully returned |
| Quantity cannot exceed returnable quantity (X). | Quantity exceeds what can be returned | Reduce the quantity | Refund Modal (`app/dashboard/pos/receipt/[id]/_components/return/RefundModal.tsx`, `handleSubmit`) | Enter quantity greater than returnable amount |
| Please select a condition for the return. | No condition was selected | Choose Defective or Change of Mind | Refund Modal (`app/dashboard/pos/receipt/[id]/_components/return/RefundModal.tsx`, `handleSubmit`) | Submit without selecting a condition |
| Please provide a reason (minimum 5 characters). | Reason is too short | Enter at least 5 characters | Refund Modal (`app/dashboard/pos/receipt/[id]/_components/return/RefundModal.tsx`, `handleSubmit`) | Enter reason shorter than 5 characters |
| Please select an item to return. | No exchange item was selected | Select an item | Exchange Modal (`app/dashboard/pos/receipt/[id]/_components/return/ExchangeModal.tsx`) | Submit without choosing an item |
| Quantity must be greater than 0. | Exchange quantity invalid | Enter positive quantity | Exchange Modal (`app/dashboard/pos/receipt/[id]/_components/return/ExchangeModal.tsx`) | Enter 0 or negative |
| This item has already been fully returned. | Item fully returned already | Choose another item | Exchange Modal (`app/dashboard/pos/receipt/[id]/_components/return/ExchangeModal.tsx`) | Exchange on fully returned item |
| Quantity cannot exceed returnable quantity (X). | Exchange quantity too high | Reduce quantity | Exchange Modal (`app/dashboard/pos/receipt/[id]/_components/return/ExchangeModal.tsx`) | Enter quantity above limit |
| Please select a condition for the return. | No condition selected | Pick a condition | Exchange Modal (`app/dashboard/pos/receipt/[id]/_components/return/ExchangeModal.tsx`) | Submit without condition |
| Please provide a reason (minimum 5 characters). | Reason too short | Enter 5+ chars | Exchange Modal (`app/dashboard/pos/receipt/[id]/_components/return/ExchangeModal.tsx`) | Enter short reason |

### Backend / API Failures

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Invalid request. Please check your inputs. | HTTP 400 from refund API | Correct inputs and retry | Refund Modal (`app/dashboard/pos/receipt/[id]/_components/return/RefundModal.tsx`, `getErrorMessage`) | Submit refund backend rejects |
| Transaction or product not found. | HTTP 404 from refund API | Verify receipt and item | Refund Modal (`app/dashboard/pos/receipt/[id]/_components/return/RefundModal.tsx`, `getErrorMessage`) | Reference non-existent transaction/product |
| An error occurred. Please try again. | Generic refund API failure | Try again | Refund Modal (`app/dashboard/pos/receipt/[id]/_components/return/RefundModal.tsx`, `getErrorMessage`) | Refund endpoint fails unexpectedly |
| An unexpected error occurred. | Non-Axios error during refund | Try again; contact support | Refund Modal (`app/dashboard/pos/receipt/[id]/_components/return/RefundModal.tsx`, `getErrorMessage`) | Non-standard error thrown |
| Invalid request. Please check your inputs. | HTTP 400 from exchange API | Fix inputs | Exchange Modal (`app/dashboard/pos/receipt/[id]/_components/return/ExchangeModal.tsx`, `getErrorMessage`) | Backend rejects exchange |
| Transaction or product not found. | HTTP 404 from exchange API | Verify IDs | Exchange Modal (`app/dashboard/pos/receipt/[id]/_components/return/ExchangeModal.tsx`, `getErrorMessage`) | Reference missing transaction/product |
| An error occurred. Please try again. | Generic exchange API failure | Retry | Exchange Modal (`app/dashboard/pos/receipt/[id]/_components/return/ExchangeModal.tsx`, `getErrorMessage`) | Exchange endpoint fails |

---

## Customers Page

### User Errors, Validation & Success

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| (none) | | | | |

### Backend / API Failures

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Failed to load customers. Please try again. | Customer list could not be fetched | Refresh and try again | Customer Table (`app/dashboard/customers/_components/CustomerTable.tsx`, `loadCustomers`) | `GET /customers` endpoint fails |
| Failed to load overdue status. | Overdue status check failed | Try again | Customer Payment Modal (`app/dashboard/customers/_components/CustomerPaymentModal.tsx`, `fetchStatus`) | Overdue status API fails |
| (submitError) Failed to record payment. | Payment recording failed | Try again; read backend message | Customer Payment Modal (`app/dashboard/customers/_components/CustomerPaymentModal.tsx`, `handleSubmit`) | Payment collection API fails |

---

## Products Page

### User Errors, Validation & Success

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Low Stock | Product quantity is at or below its reorder point | Restock the item | Product Table (`app/dashboard/products/_components/ProductTable.tsx`, status badge) | View product with `current_quantity <= reorder_point_ROP` |
| Changing the base UOM requires confirmation and will trigger a stock recount. It is blocked if the product already has stock history. | Warning: base UOM change implications | Confirm change if you understand impact | Product Form (`app/dashboard/products/_components/ProductForm.tsx`) | Change base UOM of product with stock history |

### Backend / API Failures

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Failed to load products. | Product list could not be fetched | Refresh and try again | Product Table (`app/dashboard/products/_components/ProductTable.tsx`, `fetchProducts`) | `GET /products` endpoint fails |
| Unable to delete this product. | Product deletion failed | Try again; products with transaction history cannot be deleted | Delete Product Dialog (`app/dashboard/products/_components/DeleteProductDialog.tsx`) | Delete product when backend rejects it |
| This action cannot be undone. Products with existing transaction history cannot be deleted by the backend. | Warning about deletion constraints | Consider deactivating instead | Delete Product Dialog (`app/dashboard/products/_components/DeleteProductDialog.tsx`) | Open delete confirmation for any product |

---

## Inventory Page

### User Errors, Validation & Success

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| No inventory items found. | No items match current filters | Clear filters or adjust search | Inventory Table (`app/dashboard/inventory/_components/InventoryTable.tsx`) | Apply filters matching no items |

### Backend / API Failures

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Failed to load inventory. | Inventory list could not be fetched | Click Retry or refresh | Inventory Page (`app/dashboard/inventory/page.tsx`, `error` state) | `GET /inventory` endpoint fails |
| Loading inventory... | Data is being fetched | Wait | Inventory Page (`app/dashboard/inventory/page.tsx`) | Initial page load |

---

## Inventory – Stock Movement / Adjustment

### User Errors, Validation & Success

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Matches the current stock, so there is nothing to adjust. | New count equals existing count | Enter a different count | Stock Adjustment Modal (`components/inventory/StockAdjustmentModal.tsx`) | Enter same quantity as current stock |
| Enter a whole number that is 0 or higher. | ROP validation: not a non-negative integer | Enter a valid whole number | Edit ROP Modal (`components/inventory/EditROPModal.tsx`) | Enter decimal or negative ROP |
| Warning: Removing this quantity will cause stock to become negative (X PCS). | Stock-out would drive inventory negative | Check quantity or enable negative stock override | Stock Movement Modal (`components/inventory/StockMovementModal.tsx`) | Enter stock-out quantity exceeding current stock |
| Allow negative stock override | Checkbox to permit negative inventory | Check it if you intend to allow negative stock | Stock Movement Modal (`components/inventory/StockMovementModal.tsx`) | Toggle override checkbox when negative stock would occur |

### Backend / API Failures

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Failed to load stock movements history. | Movement history could not be fetched | Retry | Stock Movements API (`lib/inventory/stock-movement-api.ts`, `fetchStockMovements`) | `GET /inventory/movements` endpoint fails |
| Failed to load staff user #X. | Staff user details could not be resolved | Try again | Stock Movements API (`lib/inventory/stock-movement-api.ts`, `fetchStaffUserById`) | Staff ID references missing user |
| Failed to record stock-in. Please try again. | Stock-in API call failed | Try again | Stock Movements API (`lib/inventory/stock-movement-api.ts`, `stockIn`) | `POST /inventory/stock-in` endpoint fails |
| Failed to record stock-out. Please try again. | Stock-out API call failed | Try again | Stock Movements API (`lib/inventory/stock-movement-api.ts`, `stockOut`) | `POST /inventory/stock-out` endpoint fails |
| Failed to adjust stock. Please try again. | Stock adjustment API call failed | Try again | Stock Movements API (`lib/inventory/stock-movement-api.ts`, `adjustInventory`) | `POST /inventory/adjust` endpoint fails |
| Failed to load ROP data. Please try again. | ROP items could not be loaded | Retry | ROP API (`lib/inventory/stock-rop-api.ts`, `fetchROPItems`) | `GET /products` (filtered for ROP) fails |
| Failed to update the reorder point. | ROP update API call failed | Try again | Edit ROP Modal (`components/inventory/EditROPModal.tsx`, `handleSubmit` catch) | `PATCH /products/{id}` endpoint fails |
| Failed to update the reorder point. | ROP save failed | Try again | ROP API (`lib/inventory/stock-rop-api.ts`, `updateReorderPoint`) | `PATCH /products/{id}` fails |

---

## Inventory – Purchase Orders

### User Errors, Validation & Success

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Purchase order #<id> created. | New PO successfully created | None | Purchase Orders Page (`app/dashboard/inventory/purchase-orders/page.tsx`, `handleCreated`) | Create PO via New Purchase Order button |
| Purchase order #<id> cancelled. | PO successfully cancelled | None | Purchase Orders Page (`app/dashboard/inventory/purchase-orders/page.tsx`, `handleCancelled`) | Cancel a PENDING PO |
| All stock levels are healthy. | No items below their reorder point | None | ROP Quick Add List (`app/dashboard/inventory/purchase-orders/_components/RopQuickAddList.tsx`) | Open ROP quick-add when all items above ROP |
| No purchase orders found. Use "New Purchase Order" to create one. | Empty PO list | Create a PO | Purchase Order Table (`app/dashboard/inventory/purchase-orders/_components/PurchaseOrderTable.tsx`) | View PO page with no orders |

### Backend / API Failures

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Failed to load purchase orders. | PO list could not be fetched | Refresh and try again | Purchase Orders Page (`app/dashboard/inventory/purchase-orders/page.tsx`, `loadOrders`) | `GET /purchase-orders` endpoint fails |
| Failed to load suppliers. | Supplier picker could not load suppliers | Try again | Create Purchase Order Form (`app/dashboard/inventory/purchase-orders/_components/CreatePurchaseOrderForm.tsx`) | Supplier fetch fails on form mount |
| Failed to load supplier details. | Selected supplier's details could not be loaded | Try again | Create Purchase Order Form (`app/dashboard/inventory/purchase-orders/_components/CreatePurchaseOrderForm.tsx`) | `GET /suppliers/{id}` endpoint fails |
| Could not search products. | Product search failed | Try again | Po Product Search (`app/dashboard/inventory/purchase-orders/_components/PoProductSearch.tsx`) | Product search endpoint fails |
| Failed to load purchase order detail. | PO detail could not be fetched | Try again | Purchase Order Items Detail (`app/dashboard/inventory/purchase-orders/_components/PurchaseOrderItemsDetail.tsx`) | `GET /purchase-orders/{id}` endpoint fails |
| Failed to load delivery totals. | Received quantities could not be fetched | Try again | Purchase Order Items Detail (`app/dashboard/inventory/purchase-orders/_components/PurchaseOrderItemsDetail.tsx`) | Received-base-by-product endpoint fails |
| Failed to load low-stock items. | Below-ROP items could not be loaded | Try again | ROP Quick Add List (`app/dashboard/inventory/purchase-orders/_components/RopQuickAddList.tsx`) | ROP fetch fails |
| Failed to cancel the purchase order. | PO cancellation failed | Try again | Cancel Purchase Order Dialog (`app/dashboard/inventory/purchase-orders/_components/CancelPurchaseOrderDialog.tsx`) | Cancel API rejects the request |

---

## Inventory – Deliveries / Receiving

### User Errors, Validation & Success

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| The start date must be on or before the end date. | Date range validation: start is after end | Correct the dates | PO Select List (`app/dashboard/inventory/deliveries/_components/POSelectList.tsx`) | Select start date after end date |
| No open Purchase Orders found | No POs available for receiving | Create a PO first | PO Select List (`app/dashboard/inventory/deliveries/_components/POSelectList.tsx`) | View PO list when all POs fulfilled/cancelled |
| No deliveries recorded yet. Use "Receive Delivery" to intake stock against open POs. | Empty deliveries table | Receive a delivery | Delivery History Table (`app/dashboard/inventory/deliveries/_components/DeliveryHistoryTable.tsx`) | View deliveries when none exist |

### Backend / API Failures

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Failed to load delivery logs. Please check your connection. | Deliveries list could not be fetched | Check connection and retry | Deliveries Page (`app/dashboard/inventory/deliveries/page.tsx`, `loadDeliveries`) | Deliveries API fails |
| Could not load Purchase Order #<id>. | PO details could not be loaded for receiving | Try again | Receive Delivery Modal (`app/dashboard/inventory/deliveries/_components/ReceiveDeliveryModal.tsx`, `handleSelectPO`) | `GET /purchase-orders/{id}` fails |
| Delivery record #<id> could not be retrieved. | Delivery detail could not be loaded | Try again | Delivery Detail View Modal (`app/dashboard/inventory/deliveries/_components/DeliveryDetailViewModal.tsx`) | `GET /deliveries/{id}` fails |
| Failed to load purchase orders. | PO select list could not load | Try again | PO Select List (`app/dashboard/inventory/deliveries/_components/POSelectList.tsx`) | PO fetch fails |

---

## Inventory – Bin Locations

### User Errors, Validation & Success

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Both Aisle Number and Shelf Location are required for exact lookup. | Exact search validation: both fields needed | Fill in both fields | Bins Page (`app/dashboard/inventory/bins/page.tsx`, `handleExactLookup`) | Submit exact search with one field empty |
| Bin location with aisle "X" and shelf "Y" does not exist. | Exact bin was not found (404) | Verify aisle and shelf values | Bins Page (`app/dashboard/inventory/bins/page.tsx`, `handleExactLookup`) | Search for non-existent bin combination |
| No bin locations found. | No bins match the search | Clear filters or add a bin | Bins Page (`app/dashboard/inventory/bins/page.tsx`) | Search for bins with no matches |
| Aisle number and shelf location are required. | Validation: both bin fields empty | Fill in both fields | Add Bin Modal (`app/dashboard/inventory/bins/_components/AddBinModal.tsx`) | Submit bin form with empty fields |
| Conflict: A bin location with this aisle and shelf already exists. | HTTP 409 – duplicate bin | Use different aisle/shelf | Add Bin Modal (`app/dashboard/inventory/bins/_components/AddBinModal.tsx`) | Create bin with existing aisle/shelf |
| Forbidden: ADMIN, MANAGER, or SECRETARY role required. | HTTP 403 – insufficient role | Contact administrator | Add Bin Modal (`app/dashboard/inventory/bins/_components/AddBinModal.tsx`) | Create bin as cashier |
| No bin locations found. | No bins match search | Try different search term | Bin Location Select (`app/dashboard/products/_components/BinLocationSelect.tsx`) | Search bins with no results |

### Backend / API Failures

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Failed to load bin locations. | Bin list could not be fetched | Refresh and try again | Bins Page (`app/dashboard/inventory/bins/page.tsx`, `fetchBins`) | `GET /bin-location` endpoint fails |
| Failed to create bin location. | Bin creation failed | Try again | Add Bin Modal (`app/dashboard/inventory/bins/_components/AddBinModal.tsx`) | `POST /bin-location` endpoint fails |
| Failed to load bin locations. | Bin search failed | Try again | Bin Location Select (`app/dashboard/products/_components/BinLocationSelect.tsx`) | Bin search fails while editing product |

---

## Inventory – Bin Assignment Modal

### User Errors, Validation & Success

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| No bins found. | No bins match the search | Refine the search | Bin Assignment Modal (`app/dashboard/inventory/_components/BinAssignmentModal.tsx`) | Search bins with no results |

### Backend / API Failures

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Failed to load bin locations. | Bin picker search failed | Try again | Bin Assignment Modal (`app/dashboard/inventory/_components/BinAssignmentModal.tsx`) | `GET /bin-location` search fails |

---

## Global / Utility Error Messages

### User Errors, Validation & Success

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| (none) | | | | |

### Backend / API Failures

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Unable to connect to server. Please check if the backend is running. | Network error (ERR_NETWORK) | Verify backend server is running | `lib/utils.ts` (`getErrorMessage`) | Disconnect backend and call any API |
| Authentication required. Please log in to continue. | HTTP 401 | Log in again | `lib/utils.ts` (`getErrorMessage`) | Use expired/missing token |
| Access denied. You do not have permission to view or perform this action. | HTTP 403 | Contact an admin | `lib/utils.ts` (`getErrorMessage`) | Attempt unauthorized action |
| An unexpected error occurred | Generic fallback error | Try again; contact support if persistent | `lib/utils.ts` (`getErrorMessage`) | Any unhandled error |
| Cannot reach the server. Check your connection and try again. | API unreachable | Verify backend | `lib/inventory/api-error.ts` (`getApiErrorMessage`) | Disconnect backend |
| You do not have permission to perform this action. | HTTP 403 | Contact an admin | `lib/inventory/api-error.ts` (`getApiErrorMessage`) | Unauthorized inventory action |
| Failed to load products from server | Product catalog load failed | Refresh | `lib/pos/hooks/use-pos-catalog.ts` | Catalog API fails |
| Failed to load categories. | Category list load failed | Refresh | `lib/products/product-categories.ts` | Categories API fails |

---

## Admin – Analytics Page (Executive Dashboard)

### User Errors, Validation & Success

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Start date must be on or before end date. Adjust the date range to load analytics. | Date range validation: start date is after end date | Fix the date range (From must be ≤ To) | Analytics Page (`app/dashboard/admin/analytics/page.tsx`, `InvalidRangeNotice`) | Select a start date later than the end date |
| No wholesale credit activity yet. | No top credit customers in the aging table | None – informational empty state | Accounts Receivable Tab (`app/dashboard/admin/analytics/_components/AccountsReceivableTab.tsx`) | View AR tab when no customers have credit balances |
| No payment breakdown for this period. | No payment method data for the selected range | Widen or change the date range | Financial Performance Tab (`app/dashboard/admin/analytics/_components/FinancialPerformanceTab.tsx`) | Select a date range with no completed transactions |
| No slow-moving stock detected for this aging window. | No items meet the slow-moving criteria | Lower the aging days threshold or widen range | Inventory Velocity Tab (`app/dashboard/admin/analytics/_components/InventoryVelocityTab.tsx`) | Set aging days high when all items are fast-moving |
| No accounts receivable data available. | No AR credit overview or aging data | None – informational empty state | Accounts Receivable Tab (`app/dashboard/admin/analytics/_components/AccountsReceivableTab.tsx`) | View AR tab when no credit customers exist |
| No inventory velocity data for this period. | No fast or slow moving items in the range | Widen the date range | Inventory Velocity Tab (`app/dashboard/admin/analytics/_components/InventoryVelocityTab.tsx`) | Select a date range with no sales data |

### Backend / API Failures

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Failed to load analytics | Analytics API call failed | Click Retry to re-fetch | Kpi Summary Cards (`app/dashboard/admin/analytics/_components/KpiSummaryCards.tsx`, `AnalyticsError`) | Dashboard summary endpoint (`/analytics/summary`) returns an error |
| Failed to load analytics | Sales performance API call failed | Click Retry to re-fetch | Financial Performance Tab (`app/dashboard/admin/analytics/_components/FinancialPerformanceTab.tsx`, `AnalyticsError`) | Sales performance endpoint (`/analytics/sales-performance`) returns an error |
| Failed to load analytics | OpEx analytics API call failed | Click Retry to re-fetch | Expenses Tab (`app/dashboard/admin/analytics/_components/ExpensesTab.tsx`, `AnalyticsError`) | Expense analytics endpoint (`/analytics/expenses`) returns an error |
| Failed to load analytics | Inventory velocity API call failed | Click Retry to re-fetch | Inventory Velocity Tab (`app/dashboard/admin/analytics/_components/InventoryVelocityTab.tsx`, `AnalyticsError`) | Inventory velocity endpoint (`/analytics/inventory-velocity`) returns an error |
| Failed to load analytics | Accounts receivable API call failed | Click Retry to re-fetch | Accounts Receivable Tab (`app/dashboard/admin/analytics/_components/AccountsReceivableTab.tsx`, `AnalyticsError`) | AR analytics endpoint (`/analytics/accounts-receivable`) returns an error |

---

## Admin – Expenses Page

### User Errors, Validation & Success

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Amount is required. | Amount field is empty | Enter an amount | Create Expense Modal (`app/dashboard/admin/expenses/_components/CreateExpenseModal.tsx`, `validateAmount`) | Submit with empty amount |
| Amount must be a number. | Amount is not a valid number | Enter a numeric value | Create Expense Modal (`app/dashboard/admin/expenses/_components/CreateExpenseModal.tsx`, `validateAmount`) | Enter text like "abc" in amount |
| Amount must be greater than 0. | Amount is zero or negative | Enter a positive amount | Create Expense Modal (`app/dashboard/admin/expenses/_components/CreateExpenseModal.tsx`, `validateAmount`) | Enter 0 or -100 |
| Use at most 2 decimal places, for example 2500.50. | Amount has more than 2 decimal places | Round to 2 decimal places | Create Expense Modal (`app/dashboard/admin/expenses/_components/CreateExpenseModal.tsx`, `validateAmount`) | Enter 2500.555 |
| Category is required. | No expense category selected | Choose a category | Create Expense Modal (`app/dashboard/admin/expenses/_components/CreateExpenseModal.tsx`, `categoryError`) | Submit without selecting category |
| No changes to save. | Edit form submitted with no modifications | Change at least one field | Edit Expense Modal (`app/dashboard/admin/expenses/_components/EditExpenseModal.tsx`, `handleSubmit`) | Open edit, change nothing, click Save Changes |
| End date must be on or after the start date. | Date range invalid: end before start | Correct the dates | Expense Filter Bar (`app/dashboard/admin/expenses/_components/ExpenseFilterBar.tsx`, `isInvalidDateRange`) | Select end date before start date |
| Expense #<id> created. | New expense successfully recorded | None | Expenses Page (`app/dashboard/admin/expenses/page.tsx`, `handleCreated`) | Create expense via New Expense button |
| Expense #<id> updated. | Existing expense modified | None | Expenses Page (`app/dashboard/admin/expenses/page.tsx`, `handleUpdated`) | Edit expense and save changes |
| Expense #<id> deleted. | Expense removed | None | Expenses Page (`app/dashboard/admin/expenses/page.tsx`, `handleDeleted`) | Delete expense from table |
| This removes the expense permanently. This cannot be undone. | Delete confirmation warning | Confirm carefully | Delete Expense Dialog (`app/dashboard/admin/expenses/_components/DeleteExpenseDialog.tsx`) | Open delete confirmation |

### Backend / API Failures

| Message Type | Meaning | Recommended Action | Page Found In | How to Reproduce |
|--------------|---------|-------------------|---------------|------------------|
| Failed to load expenses. | Expense list could not be fetched | Refresh and try again | Expenses Page (`app/dashboard/admin/expenses/page.tsx`, `loadExpenses`) | `GET /expenses` endpoint fails |
| Failed to record the expense. | Expense creation API call failed | Try again; check backend message | Create Expense Modal (`app/dashboard/admin/expenses/_components/CreateExpenseModal.tsx`, `handleSubmit` catch) | `POST /expenses` endpoint fails |
| Failed to update the expense. | Expense edit API call failed | Try again | Edit Expense Modal (`app/dashboard/admin/expenses/_components/EditExpenseModal.tsx`, `handleSubmit` catch) | `PATCH /expenses/{id}` endpoint fails |
| Failed to delete the expense. | Expense deletion API call failed | Try again | Delete Expense Dialog (`app/dashboard/admin/expenses/_components/DeleteExpenseDialog.tsx`, `handleDelete` catch) | `DELETE /expenses/{id}` endpoint fails |
| (404 message) Expense no longer exists | Expense was deleted by another user | Refresh and try again | Edit Expense Modal (`app/dashboard/admin/expenses/_components/EditExpenseModal.tsx`, `onMissing`) | Edit an expense that was deleted elsewhere |
| (404 message) Expense no longer exists | Expense already deleted | Refresh list | Delete Expense Dialog (`app/dashboard/admin/expenses/_components/DeleteExpenseDialog.tsx`, `onMissing`) | Delete an expense already removed |

---

## How This Table Was Generated

This inventory was compiled by reading all frontend source files in the `/Users/sebastianperez/Projects/soft-eng-pos` repository, searching for user-facing message strings (error banners, success banners, toast/feedback notifications, validation errors, alert dialogs, and `alert()` calls), and categorizing each by its source file (page/component), meaning, and recommended user action. Messages that are purely internal (e.g., `console.error` logs not shown to users) were excluded.

**All file paths are absolute paths within the workspace root `/Users/sebastianperez/Projects/soft-eng-pos`.**

