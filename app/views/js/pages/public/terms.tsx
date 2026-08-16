import PublicLayout from '@/components/larnr/public-layout';
import PageHeader from '@/components/larnr/page-header';
import ContentSection from '@/components/larnr/content-section';
import { useAuth } from '@/utils';

export default function Terms() {
    const auth = useAuth();

    return (
        <PublicLayout auth={auth} title="Terms of Service">
            <PageHeader
                eyebrow="Legal"
                title="Terms of Service"
                description="Last updated: August 2026. Please read these terms carefully before using Larnr."
            />

            <ContentSection title="1. Your use of Larnr">
                <p>
                    By creating an account or using the platform, you agree to these terms. You
                    must be at least 13 years old to use Larnr, and parents or guardians are
                    responsible for accounts created on behalf of younger students.
                </p>
            </ContentSection>

            <ContentSection title="2. Tutor obligations">
                <ul className="list-disc space-y-2 pl-5">
                    <li>Provide accurate information in your profile and during your interview.</li>
                    <li>Deliver lessons you have accepted, on time and prepared.</li>
                    <li>Keep student information confidential and treat students with respect.</li>
                    <li>Maintain your availability and communicate schedule changes promptly.</li>
                </ul>
            </ContentSection>

            <ContentSection title="3. Bookings and payments">
                <p>
                    Bookings are confirmed once a trial lesson or paid lesson is arranged. Fees are
                    displayed transparently before you book. Cancellation and refund policies are
                    shown at the time of booking and apply to each transaction.
                </p>
            </ContentSection>

            <ContentSection title="4. Acceptable use">
                <p>
                    You agree not to misuse the platform, attempt to disrupt its operation, scrape
                    tutor data for off-platform solicitation, or engage in fraudulent activity. We
                    may suspend or terminate accounts that violate these rules.
                </p>
            </ContentSection>

            <ContentSection title="5. Limitation of liability">
                <p>
                    Larnr provides a marketplace connecting students and educators. To the maximum
                    extent permitted by law, we are not liable for indirect, incidental or
                    consequential damages arising from your use of the platform or from lessons
                    delivered by educators.
                </p>
            </ContentSection>

            <ContentSection title="6. Changes to these terms">
                <p>
                    We may update these terms from time to time. Material changes will be
                    communicated through the platform or by email. Continued use of Larnr after
                    changes take effect constitutes acceptance of the updated terms.
                </p>
            </ContentSection>

            <ContentSection title="Contact">
                <p>
                    Questions about these terms? Email{' '}
                    <a href="mailto:hello@larnr.com" className="link link-hover text-primary">
                        hello@larnr.com
                    </a>
                    .
                </p>
            </ContentSection>
        </PublicLayout>
    );
}
