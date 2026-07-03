/**
 * Localized auth/notification strings.
 * Detects the user's language from <html lang>, localStorage, or navigator.
 * Falls back to English.
 *
 * Usage:
 *   import { t, translateAuthError } from "@/lib/authI18n";
 *   toast.error(t("wrongPassword"));
 *   toast.error(translateAuthError(err, "loginFailed"));
 */

import { sanitizeErrorMessage } from "@/lib/sanitizeError";

export type AuthLang = "ar" | "en" | "es" | "fr" | "de" | "pt" | "it" | "tr" | "ru" | "zh" | "ja";

const DICT: Record<string, Partial<Record<AuthLang, string>> & { en: string }> = {
  invalidEmail: {
    en: "Please enter a valid email address",
    ar: "من فضلك أدخل بريدًا إلكترونيًا صحيحًا",
    es: "Introduce un correo electrónico válido",
    fr: "Veuillez saisir une adresse e-mail valide",
    de: "Bitte gib eine gültige E-Mail-Adresse ein",
    pt: "Insira um endereço de e-mail válido",
    it: "Inserisci un indirizzo email valido",
    tr: "Lütfen geçerli bir e-posta adresi girin",
    ru: "Введите корректный адрес электронной почты",
    zh: "请输入有效的电子邮件地址",
    ja: "有効なメールアドレスを入力してください",
  },
  couldNotCheckEmail: {
    en: "Could not check email",
    ar: "تعذر التحقق من البريد الإلكتروني",
    es: "No se pudo verificar el correo",
    fr: "Impossible de vérifier l'e-mail",
    de: "E-Mail konnte nicht geprüft werden",
    pt: "Não foi possível verificar o e-mail",
    it: "Impossibile verificare l'email",
    tr: "E-posta kontrol edilemedi",
    ru: "Не удалось проверить email",
    zh: "无法验证电子邮件",
    ja: "メールを確認できませんでした",
  },
  otpSent: {
    en: "Verification code sent to your email",
    ar: "تم إرسال رمز التحقق إلى بريدك الإلكتروني",
    es: "Código de verificación enviado a tu correo",
    fr: "Code de vérification envoyé à votre e-mail",
    de: "Bestätigungscode an deine E-Mail gesendet",
    pt: "Código de verificação enviado para seu e-mail",
    it: "Codice di verifica inviato alla tua email",
    tr: "Doğrulama kodu e-postanıza gönderildi",
    ru: "Код подтверждения отправлен на email",
    zh: "验证码已发送至您的邮箱",
    ja: "確認コードをメールに送信しました",
  },
  couldNotSendCode: {
    en: "Could not send code",
    ar: "تعذر إرسال الرمز",
    es: "No se pudo enviar el código",
    fr: "Impossible d'envoyer le code",
    de: "Code konnte nicht gesendet werden",
    pt: "Não foi possível enviar o código",
    it: "Impossibile inviare il codice",
    tr: "Kod gönderilemedi",
    ru: "Не удалось отправить код",
    zh: "无法发送验证码",
    ja: "コードを送信できませんでした",
  },
  welcomeBack: {
    en: "Welcome back!",
    ar: "أهلًا بعودتك!",
    es: "¡Bienvenido de nuevo!",
    fr: "Heureux de vous revoir !",
    de: "Willkommen zurück!",
    pt: "Bem-vindo de volta!",
    it: "Bentornato!",
    tr: "Tekrar hoş geldiniz!",
    ru: "С возвращением!",
    zh: "欢迎回来！",
    ja: "おかえりなさい！",
  },
  wrongPassword: {
    en: "Wrong password. Please try again or reset it.",
    ar: "كلمة المرور غير صحيحة. حاول مرة أخرى أو أعد ضبطها.",
    es: "Contraseña incorrecta. Inténtalo de nuevo o restablécela.",
    fr: "Mot de passe incorrect. Réessayez ou réinitialisez-le.",
    de: "Falsches Passwort. Versuch es erneut oder setze es zurück.",
    pt: "Senha incorreta. Tente novamente ou redefina-a.",
    it: "Password errata. Riprova o reimpostala.",
    tr: "Yanlış şifre. Tekrar deneyin veya sıfırlayın.",
    ru: "Неверный пароль. Попробуйте снова или сбросьте его.",
    zh: "密码错误。请重试或重置密码。",
    ja: "パスワードが違います。再試行するかリセットしてください。",
  },
  noAccountFound: {
    en: "No account found — let's create one",
    ar: "لا يوجد حساب — لننشئ واحدًا",
    es: "No se encontró cuenta — vamos a crearla",
    fr: "Aucun compte trouvé — créons-en un",
    de: "Kein Konto gefunden — lass uns eines erstellen",
    pt: "Conta não encontrada — vamos criar uma",
    it: "Nessun account trovato — creiamone uno",
    tr: "Hesap bulunamadı — hadi bir tane oluşturalım",
    ru: "Аккаунт не найден — давайте создадим",
    zh: "未找到账户——让我们创建一个",
    ja: "アカウントが見つかりません — 作成しましょう",
  },
  loginFailed: {
    en: "Login failed",
    ar: "فشل تسجيل الدخول",
    es: "Error al iniciar sesión",
    fr: "Échec de la connexion",
    de: "Anmeldung fehlgeschlagen",
    pt: "Falha no login",
    it: "Accesso non riuscito",
    tr: "Giriş başarısız",
    ru: "Не удалось войти",
    zh: "登录失败",
    ja: "ログインに失敗しました",
  },
  verificationFailed: {
    en: "Verification failed",
    ar: "فشل التحقق",
    es: "Verificación fallida",
    fr: "Échec de la vérification",
    de: "Überprüfung fehlgeschlagen",
    pt: "Falha na verificação",
    it: "Verifica non riuscita",
    tr: "Doğrulama başarısız",
    ru: "Проверка не удалась",
    zh: "验证失败",
    ja: "確認に失敗しました",
  },
  passwordMinLength: {
    en: "Password must be at least 8 characters",
    ar: "يجب أن تكون كلمة المرور 8 أحرف على الأقل",
    es: "La contraseña debe tener al menos 8 caracteres",
    fr: "Le mot de passe doit comporter au moins 8 caractères",
    de: "Passwort muss mindestens 8 Zeichen lang sein",
    pt: "A senha deve ter pelo menos 8 caracteres",
    it: "La password deve avere almeno 8 caratteri",
    tr: "Şifre en az 8 karakter olmalıdır",
    ru: "Пароль должен содержать не менее 8 символов",
    zh: "密码至少需要 8 个字符",
    ja: "パスワードは8文字以上必要です",
  },
  emailExists: {
    en: "This email already has an account",
    ar: "هذا البريد الإلكتروني لديه حساب بالفعل",
    es: "Este correo ya tiene una cuenta",
    fr: "Cet e-mail a déjà un compte",
    de: "Diese E-Mail hat bereits ein Konto",
    pt: "Este e-mail já tem uma conta",
    it: "Questa email ha già un account",
    tr: "Bu e-posta zaten bir hesaba sahip",
    ru: "Этот email уже зарегистрирован",
    zh: "此邮箱已注册账户",
    ja: "このメールアドレスは既に登録されています",
  },
  emailExistsDesc: {
    en: "Please sign in with your existing password.",
    ar: "من فضلك سجّل الدخول بكلمة المرور الحالية.",
    es: "Inicia sesión con tu contraseña existente.",
    fr: "Connectez-vous avec votre mot de passe existant.",
    de: "Bitte melde dich mit deinem bestehenden Passwort an.",
    pt: "Faça login com sua senha atual.",
    it: "Accedi con la tua password esistente.",
    tr: "Mevcut şifrenizle giriş yapın.",
    ru: "Войдите с вашим текущим паролем.",
    zh: "请使用现有密码登录。",
    ja: "既存のパスワードでログインしてください。",
  },
  accountCreated: {
    en: "Account created!",
    ar: "تم إنشاء الحساب!",
    es: "¡Cuenta creada!",
    fr: "Compte créé !",
    de: "Konto erstellt!",
    pt: "Conta criada!",
    it: "Account creato!",
    tr: "Hesap oluşturuldu!",
    ru: "Аккаунт создан!",
    zh: "账户已创建！",
    ja: "アカウントが作成されました！",
  },
  couldNotCreate: {
    en: "Could not create account",
    ar: "تعذر إنشاء الحساب",
    es: "No se pudo crear la cuenta",
    fr: "Impossible de créer le compte",
    de: "Konto konnte nicht erstellt werden",
    pt: "Não foi possível criar a conta",
    it: "Impossibile creare l'account",
    tr: "Hesap oluşturulamadı",
    ru: "Не удалось создать аккаунт",
    zh: "无法创建账户",
    ja: "アカウントを作成できませんでした",
  },
  passwordUpdated: {
    en: "Password updated!",
    ar: "تم تحديث كلمة المرور!",
    es: "¡Contraseña actualizada!",
    fr: "Mot de passe mis à jour !",
    de: "Passwort aktualisiert!",
    pt: "Senha atualizada!",
    it: "Password aggiornata!",
    tr: "Şifre güncellendi!",
    ru: "Пароль обновлён!",
    zh: "密码已更新！",
    ja: "パスワードが更新されました！",
  },
  passwordUpdateFailed: {
    en: "Failed to update password",
    ar: "فشل تحديث كلمة المرور",
    es: "Error al actualizar la contraseña",
    fr: "Échec de la mise à jour du mot de passe",
    de: "Passwort konnte nicht aktualisiert werden",
    pt: "Falha ao atualizar a senha",
    it: "Aggiornamento password non riuscito",
    tr: "Şifre güncellenemedi",
    ru: "Не удалось обновить пароль",
    zh: "密码更新失败",
    ja: "パスワードの更新に失敗しました",
  },
  continueWithPassword: {
    en: "Continue with your password",
    ar: "تابع باستخدام كلمة المرور",
    es: "Continúa con tu contraseña",
    fr: "Continuez avec votre mot de passe",
    de: "Mit Passwort fortfahren",
    pt: "Continue com sua senha",
    it: "Continua con la tua password",
    tr: "Şifrenizle devam edin",
    ru: "Продолжите с паролем",
    zh: "使用密码继续",
    ja: "パスワードで続行",
  },
  previewProxyBlocked: {
    en: "Preview proxy blocked the login request. Please try on the published site.",
    ar: "تم حظر طلب تسجيل الدخول في المعاينة. جرّب على الموقع المنشور.",
    es: "El proxy de vista previa bloqueó el inicio de sesión. Prueba en el sitio publicado.",
    fr: "Le proxy d'aperçu a bloqué la connexion. Essayez sur le site publié.",
    de: "Der Vorschau-Proxy hat die Anmeldung blockiert. Bitte auf der veröffentlichten Seite versuchen.",
    pt: "O proxy de visualização bloqueou o login. Tente no site publicado.",
    it: "Il proxy di anteprima ha bloccato l'accesso. Prova sul sito pubblicato.",
    tr: "Önizleme proxy'si girişi engelledi. Yayınlanan sitede deneyin.",
    ru: "Прокси предпросмотра заблокировал вход. Попробуйте на опубликованном сайте.",
    zh: "预览代理阻止了登录。请在已发布的网站上尝试。",
    ja: "プレビューのプロキシがログインをブロックしました。公開済みサイトで試してください。",
  },
  typeDelete: {
    en: "Please type DELETE to confirm",
    ar: 'من فضلك اكتب "DELETE" للتأكيد',
    es: "Escribe DELETE para confirmar",
    fr: "Tapez DELETE pour confirmer",
    de: "Bitte DELETE eingeben zur Bestätigung",
    pt: "Digite DELETE para confirmar",
    it: "Digita DELETE per confermare",
    tr: "Onaylamak için DELETE yazın",
    ru: "Введите DELETE для подтверждения",
    zh: "请输入 DELETE 以确认",
    ja: "確認のため DELETE と入力してください",
  },
  enterPasswordConfirm: {
    en: "Please enter your password to confirm",
    ar: "من فضلك أدخل كلمة المرور للتأكيد",
    es: "Introduce tu contraseña para confirmar",
    fr: "Saisissez votre mot de passe pour confirmer",
    de: "Bitte Passwort zur Bestätigung eingeben",
    pt: "Digite sua senha para confirmar",
    it: "Inserisci la password per confermare",
    tr: "Onaylamak için şifrenizi girin",
    ru: "Введите пароль для подтверждения",
    zh: "请输入密码以确认",
    ja: "確認のためパスワードを入力してください",
  },
  incorrectPassword: {
    en: "Incorrect password",
    ar: "كلمة المرور غير صحيحة",
    es: "Contraseña incorrecta",
    fr: "Mot de passe incorrect",
    de: "Falsches Passwort",
    pt: "Senha incorreta",
    it: "Password errata",
    tr: "Yanlış şifre",
    ru: "Неверный пароль",
    zh: "密码错误",
    ja: "パスワードが違います",
  },
  accountDeletionRequested: {
    en: "Account deletion requested. You will be signed out.",
    ar: "تم طلب حذف الحساب. سيتم تسجيل خروجك.",
    es: "Eliminación de cuenta solicitada. Se cerrará tu sesión.",
    fr: "Suppression du compte demandée. Vous allez être déconnecté.",
    de: "Kontolöschung angefordert. Du wirst abgemeldet.",
    pt: "Exclusão de conta solicitada. Você será desconectado.",
    it: "Eliminazione account richiesta. Sarai disconnesso.",
    tr: "Hesap silme istendi. Çıkış yapacaksınız.",
    ru: "Запрошено удаление аккаунта. Вы будете выведены.",
    zh: "已请求删除账户。您将被注销。",
    ja: "アカウント削除をリクエストしました。サインアウトします。",
  },
  deleteAccountFailed: {
    en: "Failed to delete account",
    ar: "فشل حذف الحساب",
    es: "Error al eliminar la cuenta",
    fr: "Échec de la suppression du compte",
    de: "Konto konnte nicht gelöscht werden",
    pt: "Falha ao excluir a conta",
    it: "Impossibile eliminare l'account",
    tr: "Hesap silinemedi",
    ru: "Не удалось удалить аккаунт",
    zh: "删除账户失败",
    ja: "アカウントの削除に失敗しました",
  },
  freeCreditsAdded: {
    en: "+15 free credits added — welcome to Megsy!",
    ar: "+15 رصيد مجاني — أهلًا بك في Megsy!",
    es: "+15 créditos gratis añadidos — ¡bienvenido a Megsy!",
    fr: "+15 crédits gratuits ajoutés — bienvenue sur Megsy !",
    de: "+15 kostenlose Credits — willkommen bei Megsy!",
    pt: "+15 créditos grátis adicionados — bem-vindo ao Megsy!",
    it: "+15 crediti gratuiti aggiunti — benvenuto su Megsy!",
    tr: "+15 ücretsiz kredi eklendi — Megsy'ye hoş geldiniz!",
    ru: "+15 бесплатных кредитов — добро пожаловать в Megsy!",
    zh: "已添加 +15 个免费积分 — 欢迎加入 Megsy！",
    ja: "+15 の無料クレジットを追加 — Megsy へようこそ！",
  },
};

export function getUserLang(): AuthLang {
  try {
    const stored = (typeof localStorage !== "undefined" && localStorage.getItem("app_lang")) || "";
    if (stored) {
      const code = stored.toLowerCase().split("-")[0];
      if (isSupported(code)) return code as AuthLang;
    }
    if (typeof document !== "undefined") {
      const htmlLang = document.documentElement.getAttribute("lang");
      if (htmlLang) {
        const code = htmlLang.toLowerCase().split("-")[0];
        if (isSupported(code)) return code as AuthLang;
      }
      const dir = document.documentElement.getAttribute("dir");
      if (dir === "rtl") return "ar";
    }
    if (typeof navigator !== "undefined") {
      const langs = navigator.languages?.length
        ? navigator.languages
        : [navigator.language || "en"];
      for (const raw of langs) {
        const code = (raw || "").toLowerCase().split("-")[0];
        if (isSupported(code)) return code as AuthLang;
      }
    }
  } catch {}
  return "en";
}

function isSupported(code: string): boolean {
  return ["ar", "en", "es", "fr", "de", "pt", "it", "tr", "ru", "zh", "ja"].includes(code);
}

export function t(key: keyof typeof DICT, lang?: AuthLang): string {
  const L = lang || getUserLang();
  const entry = DICT[key];
  if (!entry) return String(key);
  return entry[L] || entry.en;
}

/**
 * Translate a thrown Supabase/network error into the user's language.
 * Falls back to a localized version of the provided fallback key.
 */
export function translateAuthError(
  err: unknown,
  fallbackKey: keyof typeof DICT = "loginFailed",
): string {
  const raw = sanitizeErrorMessage(err, "");
  const msg = (raw || "").toLowerCase();

  if (/invalid login|invalid credentials|wrong password|incorrect.*password/.test(msg)) {
    return t("wrongPassword");
  }
  if (/user not found|no.*account/.test(msg)) {
    return t("noAccountFound");
  }
  if (/email.*invalid|invalid.*email/.test(msg)) {
    return t("invalidEmail");
  }
  if (/already (registered|exists)|user.*exists/.test(msg)) {
    return t("emailExists");
  }
  if (/password.*(at least|short|min)/.test(msg)) {
    return t("passwordMinLength");
  }
  if (raw) return raw; // already sanitized — show as-is
  return t(fallbackKey);
}
