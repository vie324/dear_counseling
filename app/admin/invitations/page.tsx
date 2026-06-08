import { InvitationCreator } from "@/components/admin/InvitationCreator";

export const dynamic = "force-dynamic";

export default function InvitationsPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">招待URLの発行</h1>
      <p className="text-sm text-gray-500 mb-5">
        個別の問診URLを発行します。お客様にLINEやメールで共有してください。
      </p>
      <InvitationCreator />
    </div>
  );
}
