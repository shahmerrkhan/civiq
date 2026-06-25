export default function PrivacyPolicy() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">Last updated: June 2025</p>

      <section className="mb-8">
        <h2 className="font-semibold text-base mb-2">Who we are</h2>
        <p>Civiq is operated by the Civic Clarity Foundation, a Canadian non-profit. We built Civiq to help young Ontarians understand and engage with civic issues. We are not a commercial product and we do not sell your data.</p>
      </section>

      <section className="mb-8">
        <h2 className="font-semibold text-base mb-2">What we collect</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Your email address and username, provided when you sign up via Clerk</li>
          <li>Your political compass position, set during onboarding</li>
          <li>Content you create: opinions, debate messages, circle posts</li>
          <li>Actions you take: poll votes, forecast predictions, bookmarks, reactions, module completions</li>
          <li>Streak and XP data to track your civic engagement</li>
          <li>Push notification subscription tokens, if you opt in</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-semibold text-base mb-2">How we use it</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>To show you personalized civic content and track your engagement</li>
          <li>To power features like Debate Rooms, Opinion Map, and Civic Forecast</li>
          <li>To send push notifications you have opted into</li>
          <li>To improve Civiq over time</li>
        </ul>
        <p className="mt-2">We do not use your data for advertising. We do not sell or share your data with third parties except as described below.</p>
      </section>

      <section className="mb-8">
        <h2 className="font-semibold text-base mb-2">Third parties</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Clerk</strong> — handles authentication and stores your email and account info. See clerk.com/privacy.</li>
          <li><strong>Neon</strong> — our database provider, hosted in the US. Data is encrypted at rest and in transit.</li>
          <li><strong>Google Gemini</strong> — used to generate civic content. We do not send your personal information to Gemini.</li>
          <li><strong>Vercel</strong> — our hosting provider. See vercel.com/legal/privacy-policy.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-semibold text-base mb-2">Users under 18</h2>
        <p>Civiq is designed for users aged 16 and older. We do not knowingly collect data from children under 13. If you believe a child under 13 has created an account, contact us at the email below and we will delete it promptly.</p>
      </section>

      <section className="mb-8">
        <h2 className="font-semibold text-base mb-2">Your rights</h2>
        <p>Under PIPEDA and Quebec Law 25, you have the right to access, correct, or request deletion of your personal data. To do so, email us and we will respond within 30 days.</p>
      </section>

      <section className="mb-8">
        <h2 className="font-semibold text-base mb-2">Data retention</h2>
        <p>We keep your data as long as your account is active. If you delete your account, we will remove your personal data within 30 days, except where retention is required by law.</p>
      </section>

      <section className="mb-8">
        <h2 className="font-semibold text-base mb-2">Contact</h2>
        <p>Civic Clarity Foundation<br />Email: rehan.mazid@gmail.com</p>
      </section>
    </main>
  );
}