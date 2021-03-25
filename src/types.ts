interface DynamicOutput {
    content: string,
}

interface TheoryProgress {
    finished: number,
    failed: number,
    consolidated: boolean,
    canceled: boolean,
    terminated: boolean,
    warned: number,
    name: string,
    unprocessed: number,
    initialized: boolean,
    running: number,
}

interface DecorationParams {
    uri: string,
    type: string,
    content: {
        range: number[],
    }[],
}

interface Progress {
    'nodes-status': TheoryProgress[]
}

const decoration_types: string[] = [
    "background_unprocessed1",
    "background_running1",
    "background_bad",
    "background_intensify",
    "background_quoted",
    "background_antiquoted",
    "background_markdown_bullet1",
    "background_markdown_bullet2",
    "background_markdown_bullet3",
    "background_markdown_bullet4",
    "foreground_quoted",
    "foreground_antiquoted",
    "dotted_writeln",
    "dotted_information",
    "dotted_warning",
    "text_main",
    "text_keyword1",
    "text_keyword2",
    "text_keyword3",
    "text_quasi_keyword",
    "text_improper",
    "text_operator",
    "text_tfree",
    "text_tvar",
    "text_free",
    "text_skolem",
    "text_bound",
    "text_var",
    "text_inner_numeral",
    "text_inner_quoted",
    "text_inner_cartouche",
    "text_inner_comment",
    "text_dynamic",
    "text_class_parameter",
    "text_antiquote",
    "text_overview_unprocessed",
    "text_overview_running",
    "text_overview_error",
    "text_overview_warning",
    "spell_checker",
]
