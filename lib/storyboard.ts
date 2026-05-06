import z from "zod/v4"

export const sourceUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => value.length === 0 || z.url().safeParse(value).success,
    "Enter a valid URL or leave blank."
  )

export const storyboardSchema = z.object({
  panelCount: z.number().int().min(4).max(6),
  prompt: z.string().trim().min(1, "Storyboard prompt is required"),
  sourceUrl: sourceUrlSchema,
  title: z.string().trim(),
})

export type StoryboardValues = z.infer<typeof storyboardSchema>

export interface StoryboardSelectableImage {
  id: string
  prompt: string
  title: string
  url: string
}

export const STORYBOARD_DEFAULT_VALUES: StoryboardValues = {
  panelCount: 4,
  prompt: `Ta là một lão thái bà dạo chơi ngoài Tam giới, chẳng ai biết ta đã sống bao nhiêu vạn năm.
Cho đến một ngày, ta nổi hứng chạy xuống nhân gian, nhận nuôi một tiểu nha đầu đáng yêu, đặt tên cho con bé là A Linh.
Ta cho con bé ăn những loại tiên quả tốt nhất, uống quỳnh tương ngọc lộ thanh khiết nhất, nuôi nấng con bé rực rỡ như một nụ hoa.
Thế nhưng hôm nay đi săn thú trở về, thứ ta nhìn thấy lại là cái xác tàn tạ đẫm máu của A Linh.
Tên sứ giả Thiên Đình đưa thi thể con bé về run rẩy bẩm báo:
“Như Sương tiên tử nói, cả người A Linh đều là bảo vật. Thiên Đế không ngần ngại moi tim gan của cô ấy để trị bệnh cho Như Sương tiên tử, ngài còn nói… đây là phúc phận của cô ấy.”
Ta run rẩy ôm lấy A Linh, ngay cả một tia hơi thở mỏng manh nhất cũng không còn cảm nhận được nữa.
“Là ai ra tay? Thiên Đế sao?”
Mới mấy ngày trước, A Linh còn kích động khoe với ta rằng, con bé và Thiên Đế tình đầu ý hợp, Thiên Đế còn hứa hẹn sắp tới sẽ rước con bé lên làm Thiên Hậu.
Giờ đây Thiên Hậu thì chưa thấy đâu, lại vì thế thân cho “bạch nguyệt quang” của Thiên Đế mà mất mạng oan uổng.
Tên sứ giả Thiên Đình trầm mặc hồi lâu, không đành lòng khuyên nhủ ta:
“Lão phu nhân, đó là chủ tể của trời đất, một kẻ phàm nhân như ngài không đấu lại được đâu!”
Ta không nói gì, chỉ lặng lẽ vuốt ve thi cốt của A Linh.
“A Linh đừng sợ, sư phụ đi rút gân lột cốt tên Thiên Đế nhãi ranh kia, đắp lại chân thân cho con ngay đây.”`,
  sourceUrl: "",
  title: "",
}

export const storyboardCharacterSchema = z.object({
  name: z.string().trim().min(1),
  role: z.string().trim().min(1),
})

export const storyboardPageSchema = z.object({
  pageNumber: z.number().int().min(1),
  panelCount: z.number().int().min(4).max(6),
  characters: z.array(z.string().trim().min(1)).min(1).max(6),
  originalContent: z.string().trim().min(1),
  imagePrompt: z.string().trim().min(1),
})

export const storyboardAnalysisSchema = z.object({
  styleNotes: z.array(z.string().trim().min(1)).min(2).max(8),
  characters: z.array(storyboardCharacterSchema).max(8),
  pages: z.array(storyboardPageSchema).min(1).max(12),
})

export type StoryboardAnalysis = z.infer<typeof storyboardAnalysisSchema>
