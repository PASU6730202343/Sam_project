import { LessonFrame } from '../components/layout/LessonFrame';
import { useSettings } from '../features/settings/settingsStore';
import { ConversationRunner } from '../features/conversation/ConversationRunner';

export default function ConversationPage() {
  const lang = useSettings((s) => s.lang);
  return (
    <LessonFrame current="conversation" title="ฝึกสนทนา">
      {/* key ตามภาษา: สลับ EN/ZH แล้วเริ่มสถานการณ์ใหม่ในภาษานั้น */}
      {(lesson) => <ConversationRunner key={`${lesson.id}:${lang}`} lesson={lesson} lang={lang} />}
    </LessonFrame>
  );
}
