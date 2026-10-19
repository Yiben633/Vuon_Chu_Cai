import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().trim().min(1, "Nhập email phụ huynh.").email("Email chưa đúng định dạng."),
  password: z.string().min(1, "Nhập mật khẩu."),
  rememberMe: z.boolean().default(false)
});

export const signupFormSchema = z.object({
  parentDisplayName: z.string().trim().min(1, "Nhập tên phụ huynh.").max(80, "Tên tối đa 80 ký tự."),
  email: z.string().trim().min(1, "Nhập email.").email("Email chưa đúng định dạng."),
  password: z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự.").max(128, "Mật khẩu quá dài."),
  pin: z.string().regex(/^\d{4}$/, "PIN phụ huynh gồm 4 chữ số."),
  childNickname: z.string().trim().min(1, "Nhập biệt danh của bé.").max(30, "Biệt danh tối đa 30 ký tự."),
  ageBand: z.enum(["3-4", "4-5", "5-6"], { required_error: "Chọn độ tuổi của bé." }),
  dialect: z.enum(["north", "central", "south"], { required_error: "Chọn vùng giọng." }),
  mascotKey: z.string().min(1, "Chọn linh vật."),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "Cần đồng ý điều khoản để tạo tài khoản." })
  })
});

export const pinGateSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, "PIN gồm 4 chữ số.")
});

export const symbolPinSchema = z.object({
  symbol1: z.string().optional(),
  symbol2: z.string().optional(),
  symbol3: z.string().optional(),
  symbol4: z.string().optional()
});

export function signupToApiPayload(values) {
  return {
    parent: {
      displayName: values.parentDisplayName,
      email: values.email,
      password: values.password,
      pin: values.pin
    },
    child: {
      nickname: values.childNickname,
      ageBand: values.ageBand,
      dialect: values.dialect,
      mascotKey: values.mascotKey
    },
    consent: {
      termsAccepted: true,
      termsVersion: "local-mvp-v1"
    }
  };
}

export function symbolPinValues(values) {
  const symbols = [values.symbol1, values.symbol2, values.symbol3, values.symbol4].filter(Boolean);
  return symbols.length === 4 ? symbols : undefined;
}
