import type { Career } from '../types';

export const careers: Career[] = [
  { id: 'hotel', nameTh: 'โรงแรม', nameEn: 'Hotel', nameZh: '酒店', icon: '🏨', descriptionTh: 'เช็กอิน เช็กเอาต์ แม่บ้าน และงานต้อนรับ' },
  { id: 'airline', nameTh: 'สายการบิน', nameEn: 'Airline', nameZh: '航空公司', icon: '✈️', descriptionTh: 'เคาน์เตอร์เช็กอิน ประตูขึ้นเครื่อง และงานบนเครื่อง' },
  { id: 'restaurant', nameTh: 'ร้านอาหาร', nameEn: 'Restaurant', nameZh: '餐厅', icon: '🍽️', descriptionTh: 'รับออเดอร์ แนะนำเมนู และเก็บเงิน' },
  { id: 'tourism', nameTh: 'การท่องเที่ยว', nameEn: 'Tourism', nameZh: '旅游', icon: '🗺️', descriptionTh: 'ไกด์ ทัวร์ และแนะนำสถานที่' },
  { id: 'customer-service', nameTh: 'บริการลูกค้า', nameEn: 'Customer Service', nameZh: '客户服务', icon: '🎧', descriptionTh: 'รับเรื่อง แก้ปัญหา และติดตามผล' },
  { id: 'mice', nameTh: 'ไมซ์', nameEn: 'MICE', nameZh: '会展', icon: '🎪', descriptionTh: 'ประชุม ท่องเที่ยวเพื่อเป็นรางวัล งานประชุมนานาชาติ และงานแสดงสินค้า' },
  { id: 'spa', nameTh: 'สปา', nameEn: 'Spa', nameZh: '水疗', icon: '🧖', descriptionTh: 'จองคิว แนะนำทรีตเมนต์ และดูแลแขก' },
  { id: 'retail', nameTh: 'ค้าปลีก', nameEn: 'Retail', nameZh: '零售', icon: '🛍️', descriptionTh: 'ขายสินค้า ชำระเงิน และคืนสินค้า' },
];

export const getCareer = (id: string) => careers.find((c) => c.id === id);
