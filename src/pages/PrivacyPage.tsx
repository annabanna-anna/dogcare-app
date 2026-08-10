import { type ReactNode, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PublicPageShell from '../components/PublicPageShell'
import { CONTACT_EMAIL, PRIVACY_EFFECTIVE_DATE } from '../lib/siteConfig'

/**
 * The privacy policy. Written to describe what the app genuinely does —
 * Google's OAuth verification review reads this page against the scopes the
 * app requests, so anything aspirational here becomes a review failure.
 * If the data model changes, this page changes with it.
 */

function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="font-outfit font-bold text-[24px] sm:text-[27px] text-text-primary leading-tight tracking-[-0.01em] mt-14 mb-4 scroll-mt-24 first:mt-0"
    >
      {children}
    </h2>
  )
}

function H3({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-outfit font-bold text-[18px] text-text-primary leading-snug mt-7 mb-2">
      {children}
    </h3>
  )
}

function P({ children }: { children: ReactNode }) {
  return (
    <p
      className="font-dm text-[16px] text-text-secondary leading-[1.7] mt-3"
      style={{ textWrap: 'pretty' }}
    >
      {children}
    </p>
  )
}

function List({ children }: { children: ReactNode }) {
  return (
    <ul className="mt-3 flex flex-col gap-2.5 font-dm text-[16px] text-text-secondary leading-[1.7]">
      {children}
    </ul>
  )
}

function Item({ children }: { children: ReactNode }) {
  return (
    <li className="pl-5 relative">
      <span
        aria-hidden="true"
        className="absolute left-0 top-[0.6em] size-1.5 rounded-full bg-coral"
      />
      {children}
    </li>
  )
}

const CONTENTS = [
  { id: 'what-we-collect', label: 'What we collect' },
  { id: 'how-we-use-it', label: 'How we use it' },
  { id: 'google-data', label: 'Google account data' },
  { id: 'who-else', label: 'Who else handles it' },
  { id: 'retention', label: 'Keeping and deleting' },
  { id: 'your-choices', label: 'Your choices' },
  { id: 'contact', label: 'Contact' },
]

export default function PrivacyPage() {
  useEffect(() => {
    document.title = 'Privacy Policy — GoodPup'
  }, [])

  return (
    <PublicPageShell>
      <article className="mx-auto max-w-[720px] px-6 py-16 sm:py-20">
        <header>
          <h1 className="font-outfit font-bold text-text-primary text-[clamp(2rem,5vw,2.75rem)] leading-[1.05] tracking-[-0.02em]">
            Privacy Policy
          </h1>
          <p className="font-dm text-[14px] text-text-muted mt-4">
            Effective {PRIVACY_EFFECTIVE_DATE}
          </p>
        </header>

        <div className="bg-card rounded-[18px] p-6 mt-9">
          <p className="font-dm text-[16px] text-text-primary leading-[1.7]">
            GoodPup is a task-tracking app for dog sitters. It stores the dog and stay information
            you enter so it can generate your care schedule, and — only if you connect it — reads
            your booking calendar and writes your care tasks to a calendar it creates. It does not
            sell your data, show you ads, or use your information to train AI models.
          </p>
        </div>

        <nav aria-label="Contents" className="mt-10">
          <p className="font-dm font-bold text-[13px] text-text-secondary uppercase tracking-widest">
            Contents
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {CONTENTS.map((entry) => (
              <li key={entry.id}>
                <a
                  href={`#${entry.id}`}
                  className="font-dm text-[15px] text-text-secondary underline underline-offset-4 decoration-border-light hover:text-coral hover:decoration-coral transition-colors rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral"
                >
                  {entry.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-14">
          <H2 id="what-we-collect">What we collect</H2>

          <H3>Your account</H3>
          <P>
            When you sign up we store your email address. If you sign up with a password, it is
            handled by our authentication provider and we never see or store it ourselves. If you
            sign in with Google instead, we receive your email address and basic profile
            information from Google.
          </P>

          <H3>The information you enter about dogs and their owners</H3>
          <P>
            This is the core of the app, and some of it is information about other people — your
            clients. It includes:
          </P>
          <List>
            <Item>Dog details: name, breed, size, and a photo if you add one.</Item>
            <Item>Owner details: the name and contact information you record for each dog.</Item>
            <Item>
              Care instructions you write: feeding, medication, behaviour, walking, and emergency
              notes.
            </Item>
            <Item>Stays and the care tasks generated from them, including their status and notes.</Item>
          </List>
          <P>
            You are responsible for having your clients' agreement before entering their contact
            details.
          </P>

          <H3>Dog photos</H3>
          <P>
            Photos you upload are stored in a file bucket that serves them over public web
            addresses. The addresses are long and effectively unguessable, and they are not listed
            or indexed anywhere — but they are not individually access-controlled, so anyone
            holding the exact link could view that photo. Please keep this in mind before
            uploading anything sensitive.
          </P>

          <H3>Reminder notifications</H3>
          <P>
            If you turn on push reminders, we store the notification subscription your browser
            issues for that device, along with how far ahead of a task you want to be nudged. It
            lets us send the reminder and nothing else.
          </P>

          <H2 id="how-we-use-it">How we use it</H2>
          <P>We use what we collect only to run the app for you:</P>
          <List>
            <Item>To sign you in and keep your data separated from every other user's.</Item>
            <Item>To generate care schedules from the dogs and stays you set up.</Item>
            <Item>To send the task reminders you asked for.</Item>
            <Item>
              To sync with Google Calendar, if and only if you have connected it — see below.
            </Item>
          </List>
          <P>
            We do not sell your information, share it with advertisers, or use it to train machine
            learning or AI models.
          </P>

          <H2 id="google-data">Google account data</H2>
          <P>
            Connecting Google Calendar is entirely optional. GoodPup works without it. If you do
            connect it, we ask Google for permission to manage your calendars and your Google
            Tasks, and use that permission for exactly two things:
          </P>
          <List>
            <Item>
              <strong className="font-bold text-text-primary">Reading your bookings.</strong> We
              look for a calendar created by Rover's own calendar sync and read its confirmed
              bookings so your stays appear in GoodPup. If there is no such calendar, we read
              upcoming events from your primary calendar instead. We display these; we do not copy
              them into our database.
            </Item>
            <Item>
              <strong className="font-bold text-text-primary">Writing your care tasks.</strong> We
              create a separate calendar named “GoodPup” and write your meals, medications, and
              walks to it as timed events. We store the identifier Google returns for each event
              alongside the task, so that editing a task updates the same event instead of creating
              a duplicate. We do not write to your personal calendar.
            </Item>
          </List>
          <P>
            The Google Tasks permission exists only to clean up to-do items created by an earlier
            version of this feature. GoodPup no longer creates Google Tasks.
          </P>

          <H3>How your Google connection is stored</H3>
          <P>
            Google's access tokens expire after one hour. So that you do not have to reconnect
            every hour, we store the long-lived refresh token Google issues on our server, in a
            table that only our own server process can read — it is never sent to your browser and
            is never readable by other users. It is used solely to obtain new access tokens for the
            two purposes above.
          </P>

          <H3>Limited Use</H3>
          <P>
            GoodPup's use and transfer of information received from Google APIs to any other app
            will adhere to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-text-primary underline underline-offset-2 hover:text-coral transition-colors"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </P>

          <H2 id="who-else">Who else handles it</H2>
          <P>
            We keep the list of third parties short, and none of them receive your data for their
            own purposes:
          </P>
          <List>
            <Item>
              <strong className="font-bold text-text-primary">Supabase</strong> — hosts our
              database, authentication, and file storage.
            </Item>
            <Item>
              <strong className="font-bold text-text-primary">Google</strong> — only if you connect
              Google Calendar, and only as described above.
            </Item>
            <Item>
              <strong className="font-bold text-text-primary">Your browser's push service</strong>{' '}
              (Apple, Google, or Mozilla, depending on your device) — relays reminder notifications
              if you turn them on.
            </Item>
            <Item>
              <strong className="font-bold text-text-primary">Our web host</strong> — serves the app
              itself and keeps standard server logs.
            </Item>
          </List>

          <H2 id="retention">Keeping and deleting</H2>
          <P>
            We keep your information for as long as your account exists. Deleting a dog in the app
            deletes its stays, its tasks, and its photo. Disconnecting Google Calendar deletes the
            stored refresh token immediately; events already written to your “GoodPup” calendar
            stay in your Google Calendar, and you can delete them there.
          </P>
          <P>
            There is no in-app button to delete your whole account yet. Email us at{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-bold text-text-primary underline underline-offset-2 hover:text-coral transition-colors"
            >
              {CONTACT_EMAIL}
            </a>{' '}
            and we will delete your account and everything in it.
          </P>

          <H2 id="your-choices">Your choices</H2>
          <List>
            <Item>
              Connect or disconnect Google Calendar at any time in Settings. Disconnecting revokes
              our stored access.
            </Item>
            <Item>
              Keep the connection but stop writing tasks to your calendar, using the push toggle in
              Settings.
            </Item>
            <Item>
              Revoke GoodPup's access directly from your Google Account's third-party access page,
              independently of this app.
            </Item>
            <Item>Turn reminder notifications on or off per device in Settings.</Item>
            <Item>Ask us for a copy of your data, or for it to be deleted, by email.</Item>
          </List>

          <H2 id="contact">Contact</H2>
          <P>
            Questions about this policy, or about your data, go to{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-bold text-text-primary underline underline-offset-2 hover:text-coral transition-colors"
            >
              {CONTACT_EMAIL}
            </a>
            . If we change this policy in a way that materially affects how your information is
            handled, we will update the effective date above and tell you in the app.
          </P>
        </div>

        <div className="mt-16 pt-8 border-t border-border-faint">
          <Link
            to="/about"
            className="font-dm font-bold text-[15px] text-coral hover:text-coral-deep transition-colors rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral"
          >
            ← Back to GoodPup
          </Link>
        </div>
      </article>
    </PublicPageShell>
  )
}
