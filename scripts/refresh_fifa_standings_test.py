import unittest
from datetime import datetime, timezone

from refresh_fifa_standings import parse_match_page_state, should_refresh_match_state


class ParseMatchPageStateTests(unittest.TestCase):
    def test_parses_live_scores_from_match_page_meta_description(self) -> None:
        dom = '''
        <html>
          <head>
            <meta name="description" content="Round of 32, 0-1, Live, Houston Stadium, 2026-06-29T12:00:00Z">
          </head>
        </html>
        '''

        self.assertEqual(parse_match_page_state(dom), ('live', 0, 1))

    def test_treats_in_match_phase_labels_as_live(self) -> None:
        dom = '''
        <html>
          <head>
            <meta name="description" content="Round of 32, 1-1, Extra Time, Boston Stadium, 2026-06-29T20:30:00Z">
          </head>
        </html>
        '''

        self.assertEqual(parse_match_page_state(dom), ('live', 1, 1))

    def test_treats_full_time_pages_as_finished_results(self) -> None:
        dom = '''
        <html>
          <head>
            <meta name="description" content="First Stage, 2-0, Full Time, Mexico City Stadium, 2026-06-11T13:00:00Z">
          </head>
        </html>
        '''

        self.assertEqual(parse_match_page_state(dom), ('finished', 2, 0))


class ShouldRefreshMatchStateTests(unittest.TestCase):
    def test_refreshes_fixtures_kicking_off_within_the_live_window(self) -> None:
        fixture = {
            'dateSgt': 'Tue, Jun 30',
            'timeSgt': '01:00 AM',
            'status': 'upcoming',
        }

        now = datetime(2026, 6, 29, 17, 45, tzinfo=timezone.utc)

        self.assertTrue(should_refresh_match_state(fixture, now))

    def test_skips_distant_future_fixtures(self) -> None:
        fixture = {
            'dateSgt': 'Tue, Jun 30',
            'timeSgt': '09:00 AM',
            'status': 'upcoming',
        }

        now = datetime(2026, 6, 29, 17, 45, tzinfo=timezone.utc)

        self.assertFalse(should_refresh_match_state(fixture, now))


if __name__ == '__main__':
    unittest.main()
