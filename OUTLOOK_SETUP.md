# Connecting the Outlook.com account in your installed Outlook

You have Outlook installed and an Outlook.com mailbox. Manual paste works immediately. Automatic mail retrieval requires a Microsoft developer application identity and your delegated permission. The application ID identifies SignalGuard; it is not a mailbox password or a client secret.

New Outlook does not support the Outlook Object Model used by Classic Outlook. SignalGuard therefore reads the **same Microsoft mailbox** through Microsoft Graph, rather than extracting credentials, Outlook caches, or screen text. [Microsoft's client feature comparison](https://support.microsoft.com/en-gb/outlook/getstarted/feature-comparison-between-new-outlook-and-classic-outlook)

## Prerequisite: an app registration

The hackathon team registers one application once. End users of a finished product should sign in to that published, verified application rather than register their own apps. This prototype has no bundled developer identity, so its setup currently requires an application ID.

An Outlook.com account alone does not necessarily provide an Entra tenant or permission to register applications. Use an existing developer/organization tenant where you are permitted to register apps, or ask the hackathon team's Microsoft administrator. If you need a new tenant, review Microsoft's current prerequisites and account/subscription eligibility rather than assuming it is available or free. Do not enroll in a paid subscription solely to run the manual demo. [Registration guide](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app), [tenant prerequisites](https://learn.microsoft.com/en-us/entra/fundamentals/create-new-tenant)

## Register the desktop application

1. Open the Microsoft Entra admin center and select the appropriate tenant. Go to **App registrations → New registration**.
2. Name it `SignalGuard Desktop Hackathon`.
3. Choose an account type that supports **personal Microsoft accounts**. For a team demonstration with both organizational and Outlook.com users, select **Accounts in any organizational directory and personal Microsoft accounts**. Do not choose organization-only for your Outlook.com mailbox.
4. Register it and copy its **Application (client) ID** from Overview.
5. Under Authentication, enable **Allow public client flows** for this desktop/device-code application. Device-code flow does not require a redirect URI or client secret. An administrator may restrict this capability.
6. Under API permissions, add **Microsoft Graph → Delegated permissions → Mail.Read**. No `Mail.ReadWrite`, `Mail.Send`, application-wide mail access, or client secret is required. The code requests only delegated Mail.Read. Review any default permissions and the account's consent prompt.

Follow the tenant's approved app-registration process. Do not bypass administrator restrictions or Conditional Access. [Desktop configuration](https://learn.microsoft.com/en-us/entra/identity-platform/scenario-desktop-app-configuration), [device-code contract](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-device-code)

## Connect in SignalGuard

1. Start the local service with `node server.cjs` and open its loopback URL.
2. Choose **Connect Outlook** and check the explicit read-only Inbox consent.
3. Paste your registered Application ID. Set tenant to `consumers` for your personal Outlook.com mailbox, or leave `common` for an app supporting both personal and work accounts.
4. Choose **Start Microsoft sign-in**. Open the displayed Microsoft device-sign-in page yourself and enter the temporary code. Never share that code or a screenshot containing it.
5. Sign in with the same Outlook.com account used in Outlook. Review the app name and requested read permission before consenting. SignalGuard does not accept your Microsoft password.
6. Once sign-in completes, the app starts polling Inbox changes and locally assessing them. Initial sync covers the prior seven days, with up to 200 newest messages retained in memory.

Tokens never appear in the browser or logs. No token or mailbox body is written to disk by the service. The access token expires and a fresh sign-in is required. Disconnect clears local imported records and the token but does not revoke the Microsoft consent grant. [Microsoft Graph message delta](https://learn.microsoft.com/en-us/graph/api/message-delta?view=graph-rest-1.0)

## If connection cannot complete

- **Organization-only app:** create/configure a permitted registration supporting personal Microsoft accounts.
- **Public-client flow disabled / policy blocked:** ask the app owner or administrator; do not disable security policy.
- **No Entra access:** use manual paste while the team arranges the developer application. The installed New Outlook app alone cannot remove this prerequisite.
- **Gmail or other provider inside Outlook:** this Graph route does not read those mailboxes. Your Outlook.com mailbox is supported; select that account when signing in.
- **Expired token or delta cursor:** reconnect. The local session has no durable token store or refresh-token persistence.
- **Classic Outlook:** use the Graph connection for your Microsoft mailbox. The local extraction helper is excluded from the public repository; it is not required for Graph or manual paste.

Connecting the Microsoft mailbox does **not** enable NVIDIA transmission. Nemotron uses a separate API key and explicit per-message consent.
