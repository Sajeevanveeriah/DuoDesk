// TwinDesk — Copyright (C) 2026 inukaasith. GPL-3.0, see LICENSE.
// DuoDesk modifications, 2026. GPL-3.0.
// DuoDesk: releasing a file drag at an outer edge sends the files separately. It never
// fabricates a button release or transfers cursor ownership while a button is held.
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Windows.Forms;

namespace MacShare
{
    class DropEdge : Form
    {
        readonly Capture capture;
        readonly Action<Dictionary<string, object>> emit;
        readonly Timer timer = new Timer();
        string side;
        DateTime seenCross;
        bool away;

        public DropEdge(Capture capture, Action<Dictionary<string, object>> emit)
        {
            this.capture = capture; this.emit = emit;
            FormBorderStyle = FormBorderStyle.None; ShowInTaskbar = false; TopMost = true;
            StartPosition = FormStartPosition.Manual; BackColor = Color.Black; Opacity = 0.01;
            AllowDrop = true; Size = new Size(1, 1);
            DragEnter += delegate (object sender, DragEventArgs e) {
                e.Effect = e.Data.GetDataPresent(DataFormats.FileDrop) && (e.AllowedEffect & DragDropEffects.Copy) != 0
                    ? DragDropEffects.Copy : DragDropEffects.None;
            };
            DragOver += delegate (object sender, DragEventArgs e) {
                e.Effect = e.Data.GetDataPresent(DataFormats.FileDrop) && (e.AllowedEffect & DragDropEffects.Copy) != 0
                    ? DragDropEffects.Copy : DragDropEffects.None;
            };
            DragDrop += OnDrop;
            timer.Interval = 50; timer.Tick += delegate { Follow(); }; timer.Start();
        }

        protected override bool ShowWithoutActivation { get { return true; } }
        protected override CreateParams CreateParams {
            get { var cp = base.CreateParams; cp.ExStyle |= 0x80 | 0x08000000 | 0x8; return cp; }
        }

        void Follow()
        {
            // Only locally initiated outgoing transfers. Remote drags remain native on their owner.
            bool held = (Native.GetAsyncKeyState(0x01) & 0x8000) != 0;
            if (!held || !capture.DragFiles || capture.Capturing || !capture.DriveOther || capture.Side == null) { Hide(); return; }
            Native.POINT p; Native.GetCursorPos(out p);
            Rectangle m = Screen.FromPoint(new Point(p.x, p.y)).Bounds;
            side = capture.Side;
            Point probe = side == "left" ? new Point(m.Left, p.y) : side == "right" ? new Point(m.Right - 1, p.y)
                : side == "top" ? new Point(p.x, m.Top) : new Point(p.x, m.Bottom - 1);
            if (!Screens.OnOuterEdge(probe.X, probe.Y, side)) { Hide(); return; }
            if (capture.LastCross != seenCross) { seenCross = capture.LastCross; away = false; }
            int dist = side == "left" ? p.x - m.Left : side == "right" ? m.Right - 1 - p.x : side == "top" ? p.y - m.Top : m.Bottom - 1 - p.y;
            if (dist > 16) away = true;
            if (!away) { Hide(); return; }
            Rectangle r = side == "left" ? new Rectangle(m.Left, m.Top, 3, m.Height)
                : side == "right" ? new Rectangle(m.Right - 3, m.Top, 3, m.Height)
                : side == "top" ? new Rectangle(m.Left, m.Top, m.Width, 3)
                : new Rectangle(m.Left, m.Bottom - 3, m.Width, 3);
            if (Bounds != r) Bounds = r;
            if (!Visible) Show();
        }

        void OnDrop(object sender, DragEventArgs e)
        {
            Hide();
            var paths = e.Data.GetData(DataFormats.FileDrop) as string[];
            if (paths == null || paths.Length == 0 || capture.Capturing || !capture.DriveOther || !capture.DragFiles) return;
            // This is a file transfer, not an edge event. Cursor and keyboard stay on this PC.
            var message = new Dictionary<string, object>();
            message["event"] = "fileHandoff"; message["side"] = side; message["paths"] = paths;
            emit(message);
        }
    }
}
