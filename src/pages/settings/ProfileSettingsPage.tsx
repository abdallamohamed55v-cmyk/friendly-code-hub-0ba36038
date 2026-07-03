/** @doc Account — unified sub-page shell (SubShell). Identity, security and danger zone under a single calm editorial design. */
import { useState, useEffect, useRef } from "react";
import {
  MailCheck,
  ShieldEllipsis,
  KeyRound,
  UserRoundX,
  Camera,
  Pencil,
  Check,
  X,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import OliveAvatar from "@/components/branding/OliveAvatar";
import { sanitizeErrorMessage } from "@/lib/sanitizeError";
import {
  SubShell,
  SubSection,
  SubRowList,
  SubRow,
  SubStatStrip,
  DangerCallout,
} from "@/components/settings/SubShell";

const ProfileSettingsPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [credits, setCredits] = useState(0);
  const [plan, setPlan] = useState("free");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [memberSince, setMemberSince] = useState<string>("—");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      setUserId(user.id);
      setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "");
      setUserEmail(user.email || "");
      if (user.created_at) {
        const d = new Date(user.created_at);
        setMemberSince(d.toLocaleDateString(undefined, { month: "short", year: "numeric" }));
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits, plan, display_name, avatar_url, two_factor_enabled")
        .eq("id", user.id)
        .single();
      if (profile && !cancelled) {
        setCredits(Number(profile.credits) || 0);
        setPlan(profile.plan || "free");
        if (profile.display_name) setUserName(profile.display_name);
        setAvatarUrl(profile.avatar_url || user.user_metadata?.avatar_url || null);
        setTwoFactorEnabled((profile as any).two_factor_enabled ?? false);
      }
      try {
        const { data: f } = await supabase.auth.mfa.listFactors();
        if (!cancelled) {
          const verified = (f?.totp || []).some((x: any) => x.status === "verified");
          setTwoFactorEnabled(verified);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Max 5MB.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(publicUrl);
      await supabase.rpc("update_profile_safe", { p_user_id: userId, p_avatar_url: publicUrl });
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      toast.success("Profile photo updated");
    } catch (err: any) {
      toast.error(sanitizeErrorMessage(err, "Failed to upload photo"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSaveName = async () => {
    if (!nameInput.trim() || !userId) return;
    try {
      await supabase.rpc("update_profile_safe", {
        p_user_id: userId,
        p_display_name: nameInput.trim(),
      });
      await supabase.auth.updateUser({ data: { full_name: nameInput.trim() } });
      setUserName(nameInput.trim());
      setEditingName(false);
      toast.success("Name updated");
    } catch {
      toast.error("Failed to update name");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const isFree = plan === "free";

  const IdentityBlock = (
    <div className="flex items-center gap-5 flex-wrap">
              <div className="relative shrink-0">
        <div className="h-20 w-20 rounded-full overflow-hidden ring-1 ring-border">
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                    : <OliveAvatar seed={userEmail || userName} className="h-full w-full" />}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
          className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-foreground text-background ring-2 ring-background hover:scale-105 transition disabled:opacity-60"
                  aria-label="Upload photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                {uploading && (
                  <div className="absolute inset-0 grid place-items-center rounded-full bg-black/40 backdrop-blur-sm">
                    <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                {editingName ? (
          <div className="flex items-center gap-2">
                    <input
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                      autoFocus
              className="min-w-0 flex-1 bg-transparent text-[24px] font-semibold tracking-tight text-foreground outline-none border-b border-border pb-0.5 max-w-md"
                    />
            <button onClick={handleSaveName} className="grid h-8 w-8 place-items-center rounded-lg bg-foreground text-background">
                      <Check className="w-4 h-4" />
                    </button>
            <button onClick={() => setEditingName(false)} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setNameInput(userName); setEditingName(true); }}
            className="group inline-flex items-center gap-2 text-[24px] leading-[1.1] font-semibold tracking-tight text-foreground"
                  >
                    <span className="truncate">{userName || "Set your name"}</span>
            <Pencil className="w-4 h-4 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
                  </button>
                )}
        <p className="mt-1 text-[13px] text-muted-foreground truncate">{userEmail || "—"}</p>
              </div>
            </div>
  );

  return (
    <SubShell
      title="Account"
      subtitle="Your identity in Megsy, sign-in security, and account controls."
    >
      <SubSection title="Identity" description="How you show up in Megsy — name, photo and email.">
        {IdentityBlock}
      </SubSection>

      <SubSection title="Overview" description="A snapshot of your plan and account.">
        <SubStatStrip
          items={[
            { label: "Plan", value: planLabel, sub: isFree ? "Free tier" : "Active" },
            { label: "Credits", value: Math.floor(credits).toString(), sub: "Available" },
            { label: "Member since", value: memberSince, sub: "Account age" },
            { label: "2FA", value: twoFactorEnabled ? "On" : "Off", sub: twoFactorEnabled ? "OTP required" : "Not set up" },
          ]}
        />
        {isFree && (
          <button
            onClick={() => navigate("/pricing")}
            className="mt-4 w-full rounded-xl border border-primary/40 bg-primary/[0.08] px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-primary/[0.12] transition-colors"
          >
            <div>
              <p className="text-[13.5px] font-semibold text-foreground">Upgrade to Premium</p>
              <p className="text-[12px] text-muted-foreground">Higher limits, priority models, advanced agents.</p>
            </div>
            <span className="text-[12px] font-medium text-primary">Upgrade →</span>
          </button>
        )}
      </SubSection>

      <SubSection title="Security" description="Manage sign-in credentials and two-factor authentication.">
        <SubRowList>
          <SubRow
            icon={MailCheck}
            label="Change email"
            hint={userEmail || "Update primary email"}
            onClick={() => navigate("/settings/change-email")}
          />
          <SubRow
            icon={ShieldEllipsis}
            label="Change password"
            hint="Update your account password"
            onClick={() => navigate("/settings/change-password")}
          />
          <SubRow
            icon={KeyRound}
            label="Two-factor authentication"
            hint={twoFactorEnabled ? "Enabled — OTP required at sign-in" : "Disabled — tap to set up"}
            onClick={() => navigate("/settings/two-factor")}
            trailing={
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                  twoFactorEnabled
                    ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/[0.08]"
                    : "text-muted-foreground border-border"
                }`}
              >
                {twoFactorEnabled ? "On" : "Off"}
              </span>
            }
          />
        </SubRowList>
      </SubSection>

      <SubSection title="Session" description="Sign out of Megsy on this device.">
        <SubRowList>
          <SubRow icon={LogOut} label="Sign out" onClick={handleLogout} />
        </SubRowList>
      </SubSection>

      <SubSection title="Danger zone" description="Permanent actions. These cannot be undone.">
        <DangerCallout
          title="Delete account"
          description="All workspaces, chats and data are wiped. You have 30 days to cancel."
          action={
            <button
              onClick={() => navigate("/settings/delete-account")}
              className="h-9 px-4 text-[13px] font-medium rounded-full border border-rose-500/40 text-rose-300 hover:bg-rose-500/[0.08] transition"
            >
              <span className="inline-flex items-center gap-1.5">
                <UserRoundX className="w-3.5 h-3.5" />
                Delete
              </span>
            </button>
          }
        />
      </SubSection>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleAvatarUpload}
      />
    </SubShell>
  );
};

export default ProfileSettingsPage;
