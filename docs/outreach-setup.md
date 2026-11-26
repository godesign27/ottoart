# Corporate Outreach: setup

Admin › Outreach drafts emails to companies in your own Gmail, each with a board of works at `ottoart.app/for/<link>`.
Nothing is ever sent on its own: **Create Gmail draft** puts the email in Gmail's Drafts, and only **Send now** (with a confirmation) or sending it yourself from Gmail sends it.

## 1. Database (once)

Run `supabase/migrations/0004_outreach.sql` on the live Supabase database. It adds `prospects`, `outreach_steps`, `outreach_templates` and `gmail_connection`, all locked like every other table (RLS on, no access for `anon` / `authenticated`).
Locally: `npm run db:push:local`.

## 2. Google Cloud OAuth client (once, about 10 minutes)

1. Go to <https://console.cloud.google.com/>, create a project (for example "Otto Art Outreach").
2. **APIs & Services › Library**: enable the **Gmail API**.
3. **APIs & Services › OAuth consent screen**:
   - User type **External**. App name "Otto Art". Support and developer email: yours.
   - Scopes: add `.../auth/gmail.compose` and `.../auth/gmail.metadata`.
   - Test users: add the Gmail address you'll send from.
   - Then set **Publishing status** to **In production**. The app can stay unverified for your own use: Google shows an "unverified app" warning once, which you click through (Advanced › Go to Otto Art). In *Testing* mode Google expires the connection every 7 days, so Gmail would disconnect weekly.
4. **APIs & Services › Credentials › Create credentials › OAuth client ID**:
   - Application type **Web application**.
   - Authorized redirect URIs:
     - `https://ottoart.app/api/admin/gmail/callback`
     - `http://localhost:5050/api/admin/gmail/callback` (only for local testing)
   - Copy the **Client ID** and **Client secret**.

## 3. Secrets

Add these in Replit › Secrets (and in `.env.local` for local testing). Never commit them.

| Name | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | The OAuth client ID from step 2 |
| `GOOGLE_CLIENT_SECRET` | The OAuth client secret from step 2 |
| `OUTREACH_TOKEN_KEY` | 32 random bytes, base64. Make one with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. It encrypts the Gmail refresh token; if it changes, connect Gmail again. |
| `GOOGLE_REDIRECT_URI` | Optional. Only if the app runs somewhere other than ottoart.app or localhost:5050. |

Restart the app after adding them.

## 4. Connect Gmail

Admin › Outreach › **Settings** (also under Settings › Outreach & Gmail in the sidebar):

1. Fill in **Business postal address** and save. Every email ends with `Otto Artwork · <address>` and the opt-out line; drafting is blocked until the address is set.
2. Press **Connect Gmail**, choose your account, and allow both permissions:
   - *Manage drafts and send emails* (`gmail.compose`) — to create drafts and send them when you press Send now.
   - *View your email message metadata* (`gmail.metadata`) — headers only, never message text. Used to notice replies and drafts you sent from Gmail.

The refresh token is stored encrypted in `gmail_connection` and never sent to the browser. **Disconnect** revokes it.

## 5. Import the spreadsheet

1. Open *Otto Corporate Outreach — Boulder Targets.xlsx*, go to the **Targets** sheet, and save it as **CSV** (Excel: File › Save As › CSV UTF-8; Numbers: File › Export To › CSV, current sheet only).
2. Admin › Outreach › **Import CSV**, pick the file. You'll see how many are new, filled in or unchanged, and any rows left out with their line numbers. Press **Import**.

Columns are read as they are: Organization → company, Category (Healthcare → Healthcare & Wellness, Real Estate → Real Estate / Property), Week of → planned week, Why they fit / hook, Location → city, Contact name, Contact email, Status, Notes.
Week, Email 1 sent and Follow-up due are not imported: the app works those out from what you actually send.
Importing again is safe: companies already there are matched (company + email) and only blank details get filled in, so you can add contacts in the sheet and re-import.

## Weekly use

- **This week** shows one company per category (the one planned for this week, then the next uncontacted one), follow-ups due, and totals.
- Open a company: add the contact's name and email, **Choose works** for their board, check the live preview, **Create Gmail draft**. Read it in Gmail and send it from there, or press **Send now**.
- Five business days after Email 1, if they haven't replied or opted out, the follow-up shows under **Follow-ups due**. It drafts into the same Gmail thread.
- Opening the Outreach page checks Gmail: replies set the status to **Replied**, and drafts you sent from Gmail are recorded as sent. If someone replies "no thanks", set them to **Opted out**; nothing can be drafted or sent to them after that.
- Board views come from visits to their `/for/` page (your own visits while signed in as admin aren't counted).
