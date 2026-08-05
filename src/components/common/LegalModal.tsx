import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldCheck, FileText, X, ChevronLeft, Mail, AlertCircle } from 'lucide-react-native';
import { Palette, Radius, NumeralFont } from '@/constants/design';

type LegalModalProps = {
  visible: boolean;
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
};

export function LegalModal({ visible, type, onClose }: LegalModalProps) {
  const insets = useSafeAreaInsets();

  if (!visible || !type) return null;

  const isPrivacy = type === 'privacy';
  const title = isPrivacy ? 'Privacy Policy' : 'Terms of Service';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Navigation Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 16) }]}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Close legal document">
            <X size={20} color={Palette.text} strokeWidth={2.2} />
          </Pressable>

          <View style={styles.headerTitleRow}>
            {isPrivacy ? (
              <ShieldCheck size={20} color={Palette.brand} strokeWidth={2} />
            ) : (
              <FileText size={20} color={Palette.brand} strokeWidth={2} />
            )}
            <Text style={styles.headerTitle}>{title}</Text>
          </View>

          <View style={styles.headerRightSpace} />
        </View>

        {/* Document Scroll Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 40 },
          ]}>
          <View style={styles.docHeader}>
            <Text style={styles.docTitle}>{title}</Text>
            <Text style={styles.docMeta}>
              Effective Date: August 1, 2026 • Version 1.0
            </Text>
          </View>

          {isPrivacy ? <PrivacyPolicyContent /> : <TermsOfServiceContent />}
        </ScrollView>
      </View>
    </Modal>
  );
}

function PrivacyPolicyContent() {
  return (
    <View style={styles.body}>
      <Section title="1. Who We Are">
        <Text style={styles.paragraph}>
          Calora (&quot;we&quot;, &quot;our&quot;) operates the Calora mobile and web applications. We respect your privacy and are committed to protecting the personal data you share with us.
        </Text>
      </Section>

      <Section title="2. Overview & Core Principles">
        <Text style={styles.paragraph}>
          We build privacy into Calora by default:
        </Text>
        <BulletPoint text="We collect only the data needed to estimate calories and manage your daily goals." />
        <BulletPoint text="We do not sell your personal data or meal history to third-party advertisers." />
        <BulletPoint text="You can permanently delete your account and all associated data with a single tap in Profile settings." />
      </Section>

      <Section title="3. Information We Collect">
        <Text style={styles.paragraph}>When using Calora, we collect:</Text>
        <BulletPoint text="Account Details: Name, email address, and authentication IDs provided through Apple or Google sign-in." />
        <BulletPoint text="Body Metrics & Goals: Height, weight, target weight, activity level, goal pace, and diet preferences (classic, keto, vegan, vegetarian)." />
        <BulletPoint text="Meal Data: Meal names, calories, protein, carbs, fat, timestamps, and food photographs." />
      </Section>

      <Section title="4. Meal Photos & AI Vision Processing">
        <Text style={styles.paragraph}>
          When you capture or upload a meal photo, the image is processed by our secure AI vision model to determine food composition and portion estimates. Photos are processed securely over encrypted TLS connections.
        </Text>
      </Section>

      <Section title="5. How We Use Your Information">
        <Text style={styles.paragraph}>We use collected data solely to:</Text>
        <BulletPoint text="Calculate your personalized daily calorie and macronutrient targets." />
        <BulletPoint text="Analyze food photographs and log completed meals to your timeline." />
        <BulletPoint text="Provide streak analytics and progress reports in the Analytics view." />
        <BulletPoint text="Maintain security and prevent abuse of our AI infrastructure." />
      </Section>

      <Section title="6. Data Sharing & Infrastructure">
        <Text style={styles.paragraph}>
          We work with trusted infrastructure partners to host and operate Calora securely:
        </Text>
        <BulletPoint text="Clerk: Secure user authentication and account management." />
        <BulletPoint text="ImageKit: Fast, secure image hosting and optimization." />
        <BulletPoint text="OpenAI Vision API: Automated AI vision models for meal analysis." />
      </Section>

      <Section title="7. Data Security & Retention">
        <Text style={styles.paragraph}>
          Your data is encrypted both in transit (TLS 1.3) and at rest. We retain your logged meals and profile information for as long as your account remains active.
        </Text>
      </Section>

      <Section title="8. Your Rights & Account Deletion">
        <Text style={styles.paragraph}>
          You have full control over your data. You may inspect, modify, or permanently delete your account at any time from the Profile tab in the app. Account deletion instantly erases your profile, logged meals, and stored images.
        </Text>
      </Section>

      <Section title="9. Contact Privacy Team">
        <Text style={styles.paragraph}>
          For any privacy questions or data requests, please contact our privacy officer at privacy@calora.app.
        </Text>
      </Section>
    </View>
  );
}

function TermsOfServiceContent() {
  return (
    <View style={styles.body}>
      <View style={styles.disclaimerCallout}>
        <View style={styles.calloutHeader}>
          <AlertCircle size={18} color="#D97706" />
          <Text style={styles.calloutTitle}>Medical & Health Disclaimer</Text>
        </View>
        <Text style={styles.calloutText}>
          Calora is a general wellness and nutrition tracking tool. It is not a medical device and does not provide clinical, dietary, or medical advice. Always consult a qualified physician or registered dietitian before making significant changes to your diet or fitness routine.
        </Text>
      </View>

      <Section title="1. Agreement to Terms">
        <Text style={styles.paragraph}>
          By creating an account or accessing the Calora app, you agree to be bound by these Terms of Service. If you do not agree to these Terms, please do not use the application.
        </Text>
      </Section>

      <Section title="2. Description of Service">
        <Text style={styles.paragraph}>
          Calora allows you to photograph food items and receive automated estimates of calorie and macronutrient composition. These metrics are logged against personalized nutrition targets calculated from your body metrics, goal, activity level, and diet preferences.
        </Text>
      </Section>

      <Section title="3. Eligibility">
        <Text style={styles.paragraph}>
          You must be at least 16 years old to use Calora. By creating an account, you represent and warrant that you meet this age requirement.
        </Text>
      </Section>

      <Section title="4. User Account & Authentication">
        <Text style={styles.paragraph}>
          Authentication in Calora is managed via secure sign-in partners (including Apple and Google via Clerk). You are responsible for keeping your login credentials confidential and for all activity conducted through your account.
        </Text>
      </Section>

      <Section title="5. AI Estimates & Portion Accuracy">
        <Text style={styles.paragraph}>
          Calora uses advanced vision models to identify meal components and estimate weight and nutritional breakdown. While our AI strives for high precision, estimations can vary depending on portion size, hidden ingredients, and photo lighting.
        </Text>
      </Section>

      <Section title="6. User Content & Meal Photos">
        <Text style={styles.paragraph}>
          You retain ownership of all food photographs and content you submit to Calora. By uploading meal photos, you grant Calora a non-exclusive license to process your photos solely for generating nutritional estimates and operating the Service.
        </Text>
      </Section>

      <Section title="7. Acceptable Use">
        <Text style={styles.paragraph}>
          You agree not to misuse the Service, reverse engineer AI endpoints, upload unlawful material, or attempt to bypass security features.
        </Text>
      </Section>

      <Section title="8. Account Deletion">
        <Text style={styles.paragraph}>
          You may delete your account at any time in the Profile settings. Deletion permanently removes your profile and saved meal history.
        </Text>
      </Section>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function BulletPoint({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    backgroundColor: Palette.card,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.text,
  },
  headerRightSpace: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  docHeader: {
    marginBottom: 20,
    gap: 4,
  },
  docTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: -0.5,
  },
  docMeta: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.textSecondary,
  },
  body: {
    gap: 20,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.text,
    letterSpacing: -0.3,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: Palette.textSecondary,
    fontWeight: '400',
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 4,
    marginTop: 2,
  },
  bulletDot: {
    fontSize: 16,
    color: Palette.brand,
    fontWeight: '700',
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: Palette.textSecondary,
  },
  disclaimerCallout: {
    backgroundColor: '#FFFBEB',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 8,
    marginBottom: 8,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
  },
  calloutText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#B45309',
  },
  pressed: {
    opacity: 0.7,
  },
});
