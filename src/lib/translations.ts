export type Language = 'vi' | 'en';

export interface Translations {
  // Header
  title: string;
  subtitle: string;
  
  // Form labels
  senderInfo: string;
  receiverInfo: string;
  messageLabel: string;
  
  // Fields
  fullName: string;
  phone: string;
  email: string;
  message: string;
  messagePlaceholder: string;
  messageCounter: string;
  
  // Placeholders
  senderNamePlaceholder: string;
  senderPhonePlaceholder: string;
  senderEmailPlaceholder: string;
  receiverNamePlaceholder: string;
  receiverPhonePlaceholder: string;
  receiverEmailPlaceholder: string;
  
  // Buttons
  submitButton: string;
  submittingButton: string;
  homeButton: string;
  saveCardButton: string;
  shareButton: string;
  
  // Validations
  requiredFields: string;
  requiredFieldsDesc: string;
  messageTooLong: string;
  messageTooLongDesc: string;
  invalidName: string;
  invalidNameDesc: string;
  invalidEmail: string;
  invalidEmailDesc: string;
  invalidPhone: string;
  invalidPhoneDesc: string;
  duplicateInfo: string;
  duplicateName: string;
  duplicatePhone: string;
  duplicateEmail: string;
  limitedText:string;
  
  // Success/Error
  successTitle: string;
  successDesc: string;
  errorTitle: string;
  errorDesc: string;
  
  // Greeting card content
  dear: string;
  greeting: string;
  body: string;
  signature: string;
  withLove: string;
  
  // Greeting card specific
  faceWashGreeting: string;
  signatureText: string;
  
  // Share text
  shareTitle: string;
  shareText: string;
  shareSuccess: string;
  shareError: string;
  shareErrorGeneral: string;
  
  // Language switcher
  language: string;

  // Gift service section
  giftServiceSection: string;
  giftServiceLabel: string;
  giftServicePlaceholder: string;
  giftServiceVoucher: string;
  shareAndSaveButton: string;
  rule: string,

  // Terms page
  termsTitle: string;
  termsSubtitle: string;
  termsBackButton: string;
  termsContent: string[];
  lastUpdate: string;
}

export const translations: Record<Language, Translations> = {
  vi: {
    // Header
    title: "Lời Chúc Đặc Biệt",
    subtitle: "Hãy chia sẻ những lời chúc ý nghĩa đến người thân yêu của bạn",
    
    // Form labels
    senderInfo: "Thông tin người gửi",
    receiverInfo: "Thông tin người nhận",
    messageLabel: "Lời chúc",
    
    // Fields
    fullName: "Họ và tên",
    phone: "Số điện thoại",
    email: "Email",
    message: "Lời chúc của bạn",
    messagePlaceholder: "Hãy viết những lời chúc ý nghĩa đến người thân yêu của bạn...",
    messageCounter: "chữ",
    
    // Placeholders
    senderNamePlaceholder: "Nhập họ và tên của bạn",
    senderPhonePlaceholder: "0xxx xxx xxx",
    senderEmailPlaceholder: "example@email.com (tùy chọn)",
    receiverNamePlaceholder: "Nhập họ và tên người nhận",
    receiverPhonePlaceholder: "0xxx xxx xxx",
    receiverEmailPlaceholder: "example@email.com (tùy chọn)",
    
    // Buttons
    submitButton: "Gửi Lời Chúc",
    submittingButton: "Đang gửi...",
    homeButton: "Về Trang Chú",
    saveCardButton: "📸 Lưu Thiệp",
    shareButton: "🔗 Chia sẻ",
    
    // Validations
    requiredFields: "Thiếu thông tin bắt buộc",
    requiredFieldsDesc: "Vui lòng điền tên, số điện thoại và lời chúc (email là tùy chọn)",
    messageTooLong: "Lời chúc quá dài",
    messageTooLongDesc: "Lời chúc tối đa 100 chữ.",
    invalidName: "Tên không hợp lệ",
    invalidNameDesc: "Tên chỉ được chứa chữ cái và khoảng trắng, tối thiểu 2 ký tự",
    invalidEmail: "Email không hợp lệ",
    invalidEmailDesc: "Vui lòng nhập đúng định dạng email hoặc để trống",
    invalidPhone: "Số điện thoại không hợp lệ",
    invalidPhoneDesc: "Vui lòng nhập đúng định dạng số điện thoại Việt Nam",
    duplicateInfo: "Thông tin trùng lặp",
    duplicateName: "Tên người gửi và người nhận không được giống nhau",
    duplicatePhone: "Số điện thoại người gửi và người nhận không được giống nhau",
    duplicateEmail: "Email người gửi và người nhận không được giống nhau",
    limitedText: "tối đa 100",
    
    // Success/Error
    successTitle: "Gửi thành công!",
    successDesc: "Thông tin đã được lưu lại và thiệp đã sẵn sàng.",
    errorTitle: "Không thể lưu dữ liệu",
    errorDesc: "Vui lòng kiểm tra kết nối hoặc thử lại sau ít phút.",
    
    // Greeting card content
    dear: "Dear,",
    greeting: "Chúc mừng ngày 20/10!",
    body: "Luôn rạng rỡ, yêu bản thân và tận hưởng từng phút giây được nâng niu bởi Nhà Cáo. Gửi tặng bạn ngàn lời yêu thương thông qua voucher Dịch vụ Cộng thêm trị giá lên đến 299.000VND để làn da luôn được chăm sóc đúng cách dẫu ngày thường hay ngày lễ!",
    signature: "Với tình yêu thương,",
    withLove: "Với tình yêu thương,",
    
    // Greeting card specific
    faceWashGreeting: "Mùa lễ hội nhộn nhịp nhất năm đã đến rồi, Face Wash Fox gửi đến",
    signatureText: "Thân mến gửi trao ❤️!",
    
    // Share text
    shareTitle: "Thiệp chúc mừng từ Foxie Club",
    shareText: "Lời chúc từ",
    shareSuccess: "Đã tải ảnh thiệp và sao chép lời chúc vào clipboard!",
    shareError: "Đã tải ảnh thiệp. Hãy tự sao chép lời chúc từ trang giúp nhé!",
    shareErrorGeneral: "Không thể chia sẻ thiệp. Vui lòng thử lại hoặc gửi bằng cách khác nhé!",
    
    // Language switcher
    language: "Ngôn ngữ",

    // Gift service section
    giftServiceSection: "Chọn dịch vụ quà tặng",
    giftServiceLabel: "Dịch vụ",
    giftServicePlaceholder: "-- Chọn dịch vụ --",
    giftServiceVoucher: "Voucher dịch vụ Cộng thêm 269.000 - 299.000VND",

    shareAndSaveButton: "Chia sẻ hoặc lưu",
    rule: "Điều khoản sử dụng",

    // Terms page
    termsTitle: "Điều khoản sử dụng",
    termsSubtitle: "Foxie Club - Birthday Special",
    termsBackButton: "Quay lại",
    termsContent: [
      "Mỗi khách hàng được tham gia gửi/nhận quà tặng DVCT tối đa 3 lần trong suốt thời gian diễn ra CTKM;",
      "DVCT sẽ được áp dụng từ sau 1 ngày làm việc kể từ thời điểm phát sinh lời nhắn gửi và có HSD đến 12/1/2026",
      "Áp dụng với tất cả hình thức thanh toán;",
      "Không áp dụng DVCT được tặng vào ngày 24, 25, 31/12, 1/1 và thứ 7, Chủ nhật.",
      "Quà tặng không có giá trị quy đổi thành tiền mặt;",
      "Số lượng quà tặng có hạn, mọi quyết định cuối cùng thuộc về Face Wash Fox."
    ],
    lastUpdate :"Cập nhật lần cuối: "
  },
  en: {
    // Header
    title: "Special Wishes",
    subtitle: "Share meaningful wishes with your loved ones",
    
    // Form labels
    senderInfo: "Sender Information",
    receiverInfo: "Receiver Information",
    messageLabel: "Message",
    
    // Fields
    fullName: "Full Name",
    phone: "Phone Number",
    email: "Email",
    message: "Your Message",
    messagePlaceholder: "Write meaningful wishes to your loved ones...",
    messageCounter: "words",
    
    // Placeholders
    senderNamePlaceholder: "Enter your full name",
    senderPhonePlaceholder: "0xxx xxx xxx",
    senderEmailPlaceholder: "example@email.com (optional)",
    receiverNamePlaceholder: "Enter receiver's full name",
    receiverPhonePlaceholder: "0xxx xxx xxx",
    receiverEmailPlaceholder: "example@email.com (optional)",
    
    // Buttons
    submitButton: "Send Wishes",
    submittingButton: "Sending...",
    homeButton: "Back Home",
    saveCardButton: "📸 Save Card",
    shareButton: "🔗 Share",
    
    // Validations
    requiredFields: "Missing Required Information",
    requiredFieldsDesc: "Please fill in name, phone number and message (email is optional)",
    messageTooLong: "Message Too Long",
    messageTooLongDesc: "Message maximum 100 words.",
    invalidName: "Invalid Name",
    invalidNameDesc: "Name should only contain letters and spaces, minimum 2 characters",
    invalidEmail: "Invalid Email",
    invalidEmailDesc: "Please enter valid email format or leave empty",
    invalidPhone: "Invalid Phone Number",
    invalidPhoneDesc: "Please enter valid Vietnamese phone number format",
    duplicateInfo: "Duplicate Information",
    duplicateName: "Sender and receiver names cannot be the same",
    duplicatePhone: "Sender and receiver phone numbers cannot be the same",
    duplicateEmail: "Sender and receiver emails cannot be the same",
    limitedText: "maxium 100",
    
    // Success/Error
    successTitle: "Sent Successfully!",
    successDesc: "Information has been saved and card is ready.",
    errorTitle: "Cannot Save Data",
    errorDesc: "Please check your connection or try again in a few minutes.",
    
    // Greeting card content
    dear: "Dear,",
    greeting: "Happy 20/10!",
    body: "Always shine, love yourself and enjoy every moment pampered by Foxie House. Sending you thousands of loving words through additional service voucher worth up to 299,000VND so your skin is always properly cared for whether it's a regular day or a holiday!",
    signature: "With love,",
    withLove: "With love,",
    
    // Greeting card specific
    faceWashGreeting: "The most festive season of the year has arrived, Face Wash Fox sends to",
    signatureText: "With warm regards ❤️!",
    
    // Share text
    shareTitle: "Greeting card from Foxie Club",
    shareText: "Wishes from",
    shareSuccess: "Card image downloaded and message copied to clipboard!",
    shareError: "Card image downloaded. Please copy the message from the page yourself!",
    shareErrorGeneral: "Cannot share card. Please try again or use another method!",
    
    // Language switcher
    language: "Language",

    // Gift service section
    giftServiceSection: "Choose a gift service",
    giftServiceLabel: "Service",
    giftServicePlaceholder: "-- Select a service --",
    giftServiceVoucher: "Additional Service Voucher 269,000 - 299,000 VND",

    shareAndSaveButton:"Share or Save ",
    rule: "Terms of use",

    // Terms page
    termsTitle: "Terms of Use",
    termsSubtitle: "Foxie Club - 20.10 Special",
    termsBackButton: "Back",
    termsContent: [
      "Each customer can participate in sending/receiving additional service gifts up to 3 times during the promotion period;",
      "Additional services will be applied from 1 working day after the message is sent and valid until 9/11/2025",
      "Applicable to all payment methods;",
      "Additional services cannot be used on 20/10 and weekends (Saturday, Sunday).",
      "Gifts have no cash value;",

    ],
    lastUpdate :"Last Update:"
  },
};
