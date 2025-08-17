import dayjs from 'dayjs';
import { AppointmentNote, JournalEntry, Milestone, ChildProfile } from '../state/useStore';

export function generateReport(params: {
	profile: ChildProfile | null;
	journal: JournalEntry[];
	milestones: Milestone[];
	appointmentNotes: AppointmentNote[];
}): string {
	const { profile, journal, milestones, appointmentNotes } = params;
	const lines: string[] = [];

	lines.push('Gestalts Report');
	lines.push('');
	if (profile) {
		lines.push(`Child: ${profile.childName}`);
		if (profile.birthDateISO) {
			const years = dayjs().diff(dayjs(profile.birthDateISO), 'year');
			lines.push(`Age: ${years} years`);
		}
		if (profile.stage) {
			lines.push(`GLP Stage: ${profile.stage}`);
		}
		lines.push('');
	}

	lines.push('Key Milestones');
	if (milestones.length === 0) {
		lines.push('- None recorded yet.');
	} else {
		milestones.slice(0, 5).forEach((m) => {
			lines.push(`- ${m.title} (${dayjs(m.dateISO).format('YYYY-MM-DD')})${m.notes ? ` — ${m.notes}` : ''}`);
		});
	}
	lines.push('');

	lines.push('Recent Highlights');
	if (journal.length === 0) {
		lines.push('- No recent journal entries.');
	} else {
		journal.slice(0, 5).forEach((j) => {
			lines.push(`- ${dayjs(j.createdAtISO).format('YYYY-MM-DD')}: ${j.content}`);
		});
	}
	lines.push('');

	lines.push('Outstanding Questions');
	if (appointmentNotes.length === 0) {
		lines.push('- None recorded.');
	} else {
		appointmentNotes.slice(0, 10).forEach((a) => {
			lines.push(`- ${a.question}${a.specialist ? ` (for ${a.specialist})` : ''}`);
		});
	}

	return lines.join('\n');
}