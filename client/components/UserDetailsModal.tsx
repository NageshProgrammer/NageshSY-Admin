import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function UserDetailsModal({
  userId,
  open,
  onClose,
}: {
  userId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    fetch(`/api/admin/users/${userId}`)
      .then((r) => r.json())
      .then((json) => {
        setData(json.data);
        setLoading(false);
      });
  }, [userId]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-black border border-yellow-500/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-yellow-400">
            User Onboarding Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : data ? (
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="text-yellow-300 font-semibold">User</h3>
              <p>Name: {data.user.name}</p>
              <p>Email: {data.user.email}</p>
              <p>Credits: {data.user.credits}</p>
            </section>

            <section>
              <h3 className="text-yellow-300 font-semibold">Company</h3>
              <p>Company: {data.onboarding.company?.companyName}</p>
              <p>Industry: {data.onboarding.company?.industry}</p>
              <p>Website: {data.onboarding.company?.websiteUrl}</p>
            </section>

            <section>
              <h3 className="text-yellow-300 font-semibold">Target Market</h3>
              <p>Audience: {data.onboarding.target?.targetAudience}</p>
              <p>Country: {data.onboarding.target?.targetCountry}</p>
            </section>

            <section>
              <h3 className="text-yellow-300 font-semibold">Buyer Keywords</h3>
              <ul className="list-disc pl-4">
                {data.onboarding.keywords?.map((k: any) => (
                  <li key={k.keyword}>{k.keyword}</li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
