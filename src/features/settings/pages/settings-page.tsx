import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileTab } from "@/features/settings/components/profile-tab";
import { SecurityTab } from "@/features/settings/components/security-tab";
import { CompanyTab } from "@/features/settings/components/company-tab";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Your profile, security, and organization." />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="pt-6">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="security" className="pt-6">
          <SecurityTab />
        </TabsContent>
        <TabsContent value="company" className="pt-6">
          <CompanyTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
