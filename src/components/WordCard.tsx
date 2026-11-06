import type { Lang, Word } from '../types';
import { Card, IconWord } from './ui';
import { AudioButton } from './AudioButton';
import { StarButton } from './StarButton';
import { pronunciation, targetExample, targetWord } from '../features/learning/wordView';

interface Props {
  word: Word;
  lang: Lang;
  showPinyin: boolean;
  large?: boolean;
}

export function WordCard({ word, lang, showPinyin, large }: Props) {
  const text = targetWord(word, lang);
  const pron = pronunciation(word, lang, showPinyin);
  const example = targetExample(word, lang);
  return (
    <Card className={large ? 'p-6 sm:p-8' : ''}>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        <IconWord icon={word.icon} size={large ? 'lg' : 'md'} />
        <div className="min-w-0 flex-1 basis-40">
          <p lang={lang === 'en' ? 'en' : 'zh-CN'} className={`break-words font-bold ${large ? 'text-3xl sm:text-4xl' : 'text-xl'}`}>
            {text}
          </p>
          {pron && <p className={large ? 'text-lg' : 'text-sm'}>{pron}</p>}
          <p className={`mt-1 font-medium ${large ? 'text-2xl' : 'text-base'}`}>{word.th}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <AudioButton text={text} lang={lang} label={`ฟังเสียงคำว่า ${text}`} />
          <StarButton wordId={word.id} lang={lang} wordText={text} />
        </div>
      </div>
      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-frost p-3">
        <div className="min-w-0 flex-1">
          <p lang={lang === 'en' ? 'en' : 'zh-CN'} className={large ? 'text-lg' : ''}>
            {example}
          </p>
          <p className="text-sm">{word.exampleTh}</p>
        </div>
        <AudioButton text={example} lang={lang} label={`ฟังประโยคตัวอย่างของคำว่า ${text}`} />
      </div>
    </Card>
  );
}
