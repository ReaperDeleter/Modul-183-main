const db = require('./fw/db');

function escHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function getHtml(req) {
    let title = '';
    let state = '';
    let taskId = '';
    let html = '';
    const options = ["Open", "In Progress", "Done"];

    if (req.query.id !== undefined) {
        taskId = req.query.id;

        if (!/^\d+$/.test(taskId)) {
            return '<p>Ungültige Task-ID.</p>';
        }

        let conn = await db.connectDB();
        let [result] = await conn.query(
            'SELECT ID, title, state FROM tasks WHERE ID = ? LIMIT 1',
            [taskId]
        );
        if (result.length > 0) {
            title = result[0].title;
            state = result[0].state;
        }
        html += `<h1>Edit Task</h1>`;
    } else {
        html += `<h1>Create Task</h1>`;
    }

    html += `
    <form id="form" method="post" action="savetask">
        <input type="hidden" name="id" value="${escHtml(taskId)}" />
        <div class="form-group">
            <label for="title">Description</label>
            <input type="text" class="form-control size-medium" name="title" id="title" value="${escHtml(title)}">
        </div>
        <div class="form-group">
            <label for="state">State</label>
            <select name="state" id="state" class="size-auto">`;

    for (let i = 0; i < options.length; i++) {
        const selected = state === options[i].toLowerCase() ? 'selected' : '';
        html += `<option value='${escHtml(options[i].toLowerCase())}' ${selected}>${escHtml(options[i])}</option>`;
    }

    html += `
            </select>
        </div>
        <div class="form-group">
            <label for="submit"></label>
            <input id="submit" type="submit" class="btn size-auto" value="Submit" />
        </div>
    </form>
    <script>
        $(document).ready(function () {
            $('#form').validate({
                rules: {
                    title: { required: true }
                },
                messages: {
                    title: 'Please enter a description.',
                },
                submitHandler: function (form) {
                    form.submit();
                }
            });
        });
    </script>`;
    return html;
}

module.exports = { html: getHtml };