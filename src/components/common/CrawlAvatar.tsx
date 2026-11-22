import CreatorAvatar from '../../pages/creator/components/discovery/CreatorAvatar';

interface Props { src?: string; fallbackSrc?: string; name?: string; size?: number }
// Cloud persistence must not interrupt a working crawler preview.
export default function CrawlAvatar(props: Props) { return <CreatorAvatar {...props} />; }
