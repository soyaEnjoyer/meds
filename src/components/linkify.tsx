const URL_REGEX = /(\bhttps?:\/\/[^\s]+)/;

export function Linkify({ children }: { children: string }) {
  return (
    <>
      {children.split(URL_REGEX).map((part, i) =>
        URL_REGEX.exec(part) ? (
          // oxlint-disable-next-line react/no-array-index-key
          <a key={i} href={part} rel='noopener noreferrer' target='_blank' className='hover:underline'>
            {part}
          </a>
        ) : (
          part
        )
      )}
    </>
  );
}
