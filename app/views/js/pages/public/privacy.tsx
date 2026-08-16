import PublicLayout from '@/components/larnr/public-layout';
import PageHeader from '@/components/larnr/page-header';
import ContentSection from '@/components/larnr/content-section';
import { useAuth } from '@/utils';

export default function Privacy() {
    const auth = useAuth();

    return (
        <PublicLayout auth={auth} title="Privacy Policy">
            <PageHeader
                eyebrow="Legal"
                title="Privacy Policy"
                description="Last updated: August 2026. Your privacy matters to us — here is how we handle your data."
            />

            <ContentSection title="What we collect">
                <p>
                    When you create an account, we collect your name, email address, and any
                    profile information you choose to provide (such as a phone number for lesson
                    coordination or tutor credentials). Bookings, messages and lesson history are
                    stored so we can provide and improve our services.
                </p>
                <p>
                    We also collect technical information such as your browser type, device, and
                    pages visited. This helps us keep the platform secure and understand how
                    students use Larnr.
                </p>
            </ContentSection>

            <ContentSection title="How we use your data">
                <ul className="list-disc space-y-2 pl-5">
                    <li>To match students with tutors and facilitate trial lessons and bookings.</li>
                    <li>To process payments securely and prevent fraud.</li>
                    <li>To communicate about your account, bookings and platform updates.</li>
                    <li>To improve our product, measure performance and keep the platform safe.</li>
                </ul>
            </ContentSection>

            <ContentSection title="How we share data">
                <p>
                    We never sell your personal information. We share data only with service
                    providers who help run Larnr (such as payment processors and hosting), and only
                    as needed to provide the service. Tutors see the information required to
                    deliver a lesson you have booked.
                </p>
            </ContentSection>

            <ContentSection title="Your choices">
                <p>
                    You can access, correct, or delete your account information at any time from
                    your profile settings. You may also contact us to request deletion of your
                    data, subject to legal and security obligations that require us to retain
                    certain records.
                </p>
            </ContentSection>

            <ContentSection title="Contact us">
                <p>
                    Questions about this policy? Email{' '}
                    <a href="mailto:hello@larnr.com" className="link link-hover text-primary">
                        hello@larnr.com
                    </a>{' '}
                    and we will be happy to help.
                </p>
            </ContentSection>
        </PublicLayout>
    );
}
