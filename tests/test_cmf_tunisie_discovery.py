import unittest

from scripts.scraper.cmf_tunisie_daily import extract_date_from_filename, is_cmf_nav_file_href


class CmfTunisieDiscoveryContractTest(unittest.TestCase):
    def test_historical_filename_family_is_preserved(self):
        self.assertEqual(extract_date_from_filename("valeurs_liquidatives_260828.xlsx"), "2026-08-28")
        self.assertEqual(extract_date_from_filename("valeurs_liquidatives_250918.xlsx"), "2025-09-18")

    def test_current_september_2026_filename_families(self):
        cases = {
            "vl_du_16_septembre_2026.xlsx": "2026-09-16",
            "vl_du_15_septembre_2026.xlsx": "2026-09-15",
            "vl_du_14-09-26.xlsx": "2026-09-14",
            "vl_10_09_2026.xlsx": "2026-09-10",
            "vl09092026.xlsx": "2026-09-09",
            "vl08092026.xlsx": "2026-09-08",
            "vl_31_août_2026.xlsx": "2026-08-31",
        }
        for filename, expected in cases.items():
            with self.subTest(filename=filename):
                self.assertEqual(extract_date_from_filename(filename), expected)

    def test_compact_ddmmyyyy_is_not_misread_as_yymmdd(self):
        self.assertEqual(extract_date_from_filename("vl09092026.xlsx"), "2026-09-09")
        self.assertNotEqual(extract_date_from_filename("vl09092026.xlsx"), "2009-09-20")

    def test_discovery_accepts_only_nav_excel_naming_families(self):
        accepted = [
            "/sites/default/files/pdfs/epargne/vl/valeurs_liquidatives_260828.xlsx",
            "https://www.cmf.tn/sites/default/files/pdfs/epargne/vl/vl_du_16_septembre_2026.xlsx",
            "https://www.cmf.tn/sites/default/files/pdfs/epargne/vl/vl09092026.xlsx?download=1",
        ]
        rejected = [
            "/sites/default/files/pdfs/epargne/vl/report_20260916.xlsx",
            "/sites/default/files/pdfs/epargne/vl/vl_du_16_septembre_2026.pdf",
            "/document/autre.csv",
            "",
        ]
        for href in accepted:
            with self.subTest(href=href):
                self.assertTrue(is_cmf_nav_file_href(href))
        for href in rejected:
            with self.subTest(href=href):
                self.assertFalse(is_cmf_nav_file_href(href))


if __name__ == "__main__":
    unittest.main()
