import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import DishBarLogo from '@/components/DishBarLogo';
import { getLocale } from '@/lib/api';

const LEGAL_PAGES: Record<string, { title: string; titleFa: string; titleFr: string; content: string }> = {
  terms: {
    title: 'Terms of Service',
    titleFa: 'شرایط استفاده از خدمات',
    titleFr: "Conditions d'utilisation",
    content: `
# Terms of Service

**Last updated: July 2026**

⚠️ DRAFT — This document requires legal review before public launch.

## 1. Acceptance of Terms

By accessing or using DishBar ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.

## 2. Description of Service

DishBar is a marketplace platform connecting home-based food preparers ("Chefs") with customers ("Buyers") in Ontario, Canada. DishBar does not prepare, cook, or deliver food. DishBar facilitates transactions between Chefs and Buyers.

## 3. Eligibility

- You must be at least 18 years old to use DishBar.
- Chefs must comply with Ontario Regulation 493/17 (Food Premises) and all applicable health regulations.
- Chefs must maintain valid food handler certifications where required.

## 4. User Accounts

- You are responsible for maintaining the confidentiality of your account credentials.
- You must provide accurate and complete information during registration.
- You may not transfer your account to another person.

## 5. Orders and Payments

- All prices are in Canadian Dollars (CAD) and include applicable taxes where indicated.
- Payment is processed through Stripe. DishBar does not store credit card information.
- Orders are confirmed only after successful payment.
- A platform service fee applies to all orders.

## 6. Cancellations and Refunds

- See our separate Cancellation and Refund Policy for details.
- DishBar reserves the right to cancel orders if a Chef cannot fulfill them.

## 7. Food Safety Disclaimer

- DishBar does not inspect, certify, or guarantee the safety of food prepared by Chefs.
- Customers with food allergies must contact Chefs directly before ordering.
- DishBar cannot guarantee an allergen-free environment.

## 8. Limitation of Liability

DishBar is a marketplace facilitator only. To the maximum extent permitted by law, DishBar shall not be liable for any illness, injury, or damages arising from food consumed through the Platform.

## 9. Intellectual Property

All DishBar branding, logos, and platform content are owned by DishBar. Chef-submitted content remains the property of the respective Chef.

## 10. Termination

DishBar may suspend or terminate accounts that violate these Terms without prior notice.

## 11. Governing Law

These Terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable therein.

## 12. Contact

For questions about these Terms, contact: support@dishbar.ca
    `,
  },
  privacy: {
    title: 'Privacy Policy',
    titleFa: 'سیاست حفظ حریم خصوصی',
    titleFr: 'Politique de confidentialité',
    content: `
# Privacy Policy

**Last updated: July 2026**

⚠️ DRAFT — This document requires legal review before public launch. Must comply with PIPEDA and CASL.

## 1. Information We Collect

**Account Information:** Name, email address, phone number, delivery address.

**Chef Information:** Business name, address (kept private), food handler certifications, identification documents.

**Order Information:** Order history, payment records, delivery addresses.

**Usage Data:** Browser type, IP address, pages visited, device information.

## 2. How We Use Your Information

- To process orders and facilitate transactions
- To communicate order status and platform updates
- To verify Chef identities and compliance
- To improve our services
- To comply with legal obligations

## 3. Information Sharing

We share information with:
- **Chefs:** Your name, phone, and delivery address (for order fulfillment only)
- **Stripe:** Payment processing (PCI-DSS compliant)
- **Law enforcement:** When required by law

We do NOT:
- Sell your personal information
- Share your data with advertisers
- Publicly display Chef home addresses

## 4. Data Security

- All data transmitted via HTTPS/TLS encryption
- Payment data handled by Stripe (PCI-DSS Level 1)
- Chef documents stored in private, encrypted storage
- Access restricted to authorized personnel only

## 5. Data Retention

- Account data retained while account is active
- Order history retained for 7 years (tax/legal requirements)
- Deleted accounts: personal data removed within 30 days

## 6. Your Rights (PIPEDA)

You have the right to:
- Access your personal information
- Correct inaccurate information
- Withdraw consent (subject to legal obligations)
- Request deletion of your data

## 7. Cookies

We use essential cookies for authentication and session management. No third-party tracking cookies are used during the pilot.

## 8. Contact

Privacy Officer: privacy@dishbar.ca
    `,
  },
  refund: {
    title: 'Cancellation & Refund Policy',
    titleFa: 'سیاست لغو و بازپرداخت',
    titleFr: "Politique d'annulation et de remboursement",
    content: `
# Cancellation & Refund Policy

**Last updated: July 2026**

⚠️ DRAFT — This document requires legal review before public launch.

## Customer Cancellations

- **Within 30 minutes of ordering:** Full refund, no questions asked.
- **After 30 minutes but before preparation starts:** Full refund minus a $2.00 processing fee.
- **After preparation has started:** No refund available (Chef has already begun work).

## Chef Cancellations

If a Chef cancels your order:
- You will receive a full refund including all fees.
- Refunds are processed within 5-10 business days.

## Quality Issues

If you receive food that is:
- Significantly different from the description
- Spoiled or unsafe
- Missing items

Contact us within 2 hours of delivery/pickup at support@dishbar.ca with photos. We will investigate and issue a full or partial refund at our discretion.

## Refund Method

All refunds are processed back to the original payment method via Stripe.

## Disputes

If you disagree with a refund decision, contact support@dishbar.ca. We will review within 48 hours.

## Chef Payouts

During the pilot period, Chef payouts are processed manually after order completion and any refund window has passed.
    `,
  },
  'chef-agreement': {
    title: 'Chef Agreement',
    titleFa: 'قرارداد آشپز',
    titleFr: 'Accord du chef',
    content: `
# Chef Agreement

**Last updated: July 2026**

⚠️ DRAFT — This document requires legal review before public launch.

## 1. Eligibility

To sell food on DishBar, you must:
- Be at least 18 years old
- Reside in Ontario, Canada
- Comply with Ontario Regulation 493/17 (Food Premises)
- Hold a valid food handler certification (where required by your local health unit)
- Provide accurate identity verification
- Maintain appropriate liability insurance (recommended)

## 2. Food Safety Obligations

As a Chef on DishBar, you agree to:
- Prepare food in a clean, safe environment
- Accurately list all ingredients and potential allergens
- Follow safe food handling, storage, and temperature practices
- Not sell food past its safe consumption date
- Respond to customer allergy inquiries promptly and honestly
- Comply with all applicable health regulations

## 3. Platform Commission

- DishBar charges a 15% commission on the food subtotal (before delivery fees and taxes).
- Commission rates may change with 30 days written notice.

## 4. Payouts

- During the pilot period, payouts are processed manually within 7 business days of order completion.
- Payouts are made via Stripe Connect to your connected bank account.
- You are responsible for reporting income and paying applicable taxes.

## 5. Order Acceptance

- You may accept or reject orders at your discretion.
- Repeated order rejections without valid reason may result in account review.
- You must fulfill accepted orders as described in your menu listing.

## 6. Account Suspension

DishBar may suspend or terminate your Chef account for:
- Food safety violations
- Repeated customer complaints
- Failure to fulfill accepted orders
- Providing false information
- Violation of these terms

## 7. Independent Contractor

You are an independent contractor, not an employee of DishBar. You are responsible for your own taxes, insurance, and regulatory compliance.

## 8. Liability

You agree to indemnify DishBar against claims arising from food you prepare and sell through the Platform.
    `,
  },
  'food-safety': {
    title: 'Food Safety & Allergen Notice',
    titleFa: 'اطلاعیه ایمنی غذا و آلرژن',
    titleFr: 'Avis de sécurité alimentaire et allergènes',
    content: `
# Food Safety & Allergen Notice

**Last updated: July 2026**

## Important Notice

DishBar connects you with independent home-based food preparers. DishBar does not prepare, inspect, or certify any food sold on the platform.

## Allergen Warning

⚠️ **IMPORTANT:** Food prepared by home chefs may contain or come into contact with common allergens including but not limited to:

- Nuts (peanuts, tree nuts, pistachios, walnuts, almonds)
- Dairy (milk, cream, butter, yogurt)
- Eggs
- Wheat/Gluten
- Soy
- Fish and Shellfish
- Sesame

**If you have a severe food allergy:**
1. Contact the Chef directly BEFORE ordering
2. Clearly communicate your allergy requirements
3. Ask about cross-contamination risks
4. Do not order if you cannot confirm safety

**DishBar cannot guarantee an allergen-free environment.** Home kitchens are not certified allergen-free facilities.

## Food Handling

All Chefs on DishBar agree to:
- Follow safe food handling practices
- List ingredients and known allergens for each dish
- Store and transport food at safe temperatures
- Not sell food past its safe consumption date

## Your Responsibility

By ordering on DishBar, you acknowledge that:
- You have reviewed the ingredient list for your order
- You have communicated any allergies to the Chef if applicable
- You understand that home-prepared food carries inherent risks
- You will follow any storage and reheating instructions provided

## Reporting Concerns

If you experience a food safety issue, contact us immediately:
- Email: support@dishbar.ca
- Include: Order number, description of issue, photos if applicable

We take food safety seriously and will investigate all reports.
    `,
  },
  delivery: {
    title: 'Delivery & Pickup Policy',
    titleFa: 'سیاست تحویل و دریافت',
    titleFr: 'Politique de livraison et retrait',
    content: `
# Delivery & Pickup Policy

**Last updated: July 2026**

## Delivery Options

DishBar offers three fulfillment methods (availability varies by Chef):

### 1. Customer Pickup
- Free of charge
- Pickup location provided after order confirmation
- Pickup within the time window specified by the Chef
- Please bring your order confirmation

### 2. Chef Self-Delivery
- Delivery fee calculated based on distance
- Available within the Chef's delivery radius
- Estimated delivery time provided at checkout

### 3. Third-Party Delivery
- Currently not available during pilot
- Will be added in future updates

## Delivery Areas (Pilot)

During the pilot period, delivery is available only in select Ontario postal code areas. Check availability at checkout.

## Delivery Fees

- Base fee: Configured by platform administrator
- Distance-based: Additional fee per km beyond included distance
- Maximum cap applies
- Pickup is always free

## Delivery Times

- Delivery times are estimates and not guaranteed
- Chefs will communicate any delays directly
- DishBar is not responsible for delays caused by traffic, weather, or other factors

## Failed Deliveries

If delivery cannot be completed (wrong address, no one available):
- Chef will attempt to contact you
- Food safety: perishable items cannot be left unattended
- Redelivery may incur additional fees

## Temperature & Safety

- Hot food should be consumed within 2 hours of preparation
- Cold items should be refrigerated upon receipt
- Follow any storage instructions provided by the Chef
    `,
  },
  community: {
    title: 'Community & Review Guidelines',
    titleFa: 'دستورالعمل جامعه و نظرات',
    titleFr: 'Directives communautaires et avis',
    content: `
# Community & Review Guidelines

**Last updated: July 2026**

## Our Community Values

DishBar is built on respect, trust, and a shared love of food. We expect all members to:
- Treat each other with respect and courtesy
- Communicate honestly and constructively
- Respect cultural diversity and food traditions

## Review Guidelines

When leaving a review:

### Do:
- Be honest about your experience
- Mention specific dishes and what you liked/disliked
- Be constructive with criticism
- Update your review if an issue was resolved

### Don't:
- Use offensive, discriminatory, or threatening language
- Include personal information (addresses, phone numbers)
- Leave fake reviews (for yourself or against competitors)
- Review food you didn't actually order
- Use reviews to harass or bully

## Review Moderation

DishBar reserves the right to remove reviews that:
- Contain hate speech or discrimination
- Include personal/private information
- Are clearly fraudulent or spam
- Violate any applicable laws

## Chef Responses

Chefs may respond to reviews publicly. Responses must be professional and constructive.

## Reporting

To report a review or community issue: support@dishbar.ca
    `,
  },
  contact: {
    title: 'Contact & Support',
    titleFa: 'تماس و پشتیبانی',
    titleFr: 'Contact et assistance',
    content: `
# Contact & Customer Support

## How to Reach Us

**Email:** support@dishbar.ca
**Phone:** +1-647-000-0000 (during business hours)

**Business Hours:**
Monday - Friday: 9:00 AM - 8:00 PM EST
Saturday - Sunday: 10:00 AM - 6:00 PM EST

## Response Times

- Email: Within 24 hours (business days)
- Urgent food safety issues: Within 4 hours

## Common Issues

### Order Problems
- Wrong items received
- Missing items
- Quality concerns
- Late delivery

**What to do:** Email support@dishbar.ca with your order number and photos if applicable.

### Account Issues
- Login problems
- Profile updates
- Account deletion requests

### Chef Support
- Application status
- Payout questions
- Menu management help

## Feedback

We welcome your feedback to improve DishBar. Email us at feedback@dishbar.ca.

## Legal Inquiries

For legal matters: legal@dishbar.ca

---

*DishBar is currently in pilot mode. Response times may vary. Thank you for your patience as we grow.*
    `,
  },
};

export default function LegalPage() {
  const { page } = useParams<{ page: string }>();
  const navigate = useNavigate();
  const locale = getLocale();
  const isRtl = locale === 'fa';

  const legalPage = page ? LEGAL_PAGES[page] : null;

  if (!legalPage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Page Not Found</h1>
          <Button onClick={() => navigate('/')} className="cursor-pointer">Back to Home</Button>
        </div>
      </div>
    );
  }

  const title = locale === 'fa' ? legalPage.titleFa : locale === 'fr' ? legalPage.titleFr : legalPage.title;

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="cursor-pointer gap-2">
            <ArrowLeft className="w-4 h-4" />
            {locale === 'fa' ? 'بازگشت' : locale === 'fr' ? 'Retour' : 'Back'}
          </Button>
          <DishBarLogo size="sm" />
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{title}</h1>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {legalPage.content.split('\n').map((line, i) => {
            if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mt-8 mb-4">{line.slice(2)}</h1>;
            if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-semibold mt-6 mb-3">{line.slice(3)}</h2>;
            if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-medium mt-4 mb-2">{line.slice(4)}</h3>;
            if (line.startsWith('- ')) return <li key={i} className="ml-4 text-muted-foreground">{line.slice(2)}</li>;
            if (line.startsWith('⚠️')) return <p key={i} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm font-medium">{line}</p>;
            if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold">{line.slice(2, -2)}</p>;
            if (line.trim() === '') return <br key={i} />;
            if (line.startsWith('*') && line.endsWith('*')) return <p key={i} className="text-sm italic text-muted-foreground">{line.slice(1, -1)}</p>;
            return <p key={i} className="text-muted-foreground leading-relaxed">{line}</p>;
          })}
        </div>

        {/* Links to other legal pages */}
        <div className="mt-12 pt-8 border-t">
          <h3 className="font-semibold mb-4">{locale === 'fa' ? 'صفحات قانونی' : locale === 'fr' ? 'Pages légales' : 'Legal Pages'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(LEGAL_PAGES).map(([key, val]) => (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                className="justify-start cursor-pointer"
                onClick={() => navigate(`/legal/${key}`)}
              >
                {locale === 'fa' ? val.titleFa : locale === 'fr' ? val.titleFr : val.title}
              </Button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}