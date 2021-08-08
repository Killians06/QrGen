import XLSX from 'xlsx';

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';


Template.hello.onCreated(function helloOnCreated() {
    // counter starts at 0
    this.counter = new ReactiveVar(0);

});

Template.hello.helpers({
    counter() {
        return Template.instance().counter.get();
    },
});

Template.hello.events({
    'click button'(event, instance) {
        // increment the counter when button is clicked
        instance.counter.set(instance.counter.get() + 1);
    },
});

Template.import.onCreated(function importOnCreated() {
    // counter starts at 0
    this.fichier = new ReactiveVar("");
});

Template.import.helpers({
    fichier() {
        return Template.instance().fichier.get();
    },
});

Template.import.events({
    'change .uploadFile': function (event, instance) {
        let obj={push:function push(element){ [].push.call(this,element)}};
        const file = event.currentTarget.files[0];
        const reader = new FileReader();
        const rABS = !!reader.readAsBinaryString;
        reader.onload = function(e) {
            const data = e.target.result;
            const name = file.name;
            /* Meteor magic */
            Meteor.call(rABS ? 'uploadS' : 'uploadU', rABS ? data : new Uint8Array(data), name, function(err, wb) {
                if (err) throw err;
                /* load the first worksheet */
                const ws = wb.Sheets[wb.SheetNames[0]];
                /* generate HTML table and enable export */
                const html = XLSX.utils.sheet_to_html(ws, { editable: false });

                for (let i=1; i <= 8; i++) {
                    const K = (ws['A' + i].h);
                    const V = (ws['B' + i].h);
                    obj.push({ville: K, site: V});

                }

                document.getElementById('out').innerHTML = html;
                document.getElementById('dnload').disabled = false;
                console.log(obj);

                Meteor.call('db_save', obj, function (err, data) {
                    if (err) throw err;
                    this.data = obj;
                    return data;
                });
            });
        };
        if(rABS) reader.readAsBinaryString(file); else reader.readAsArrayBuffer(file);
        instance.fichier.set(file['name']);
    },
    'click .dnload' () {
        const html = document.getElementById('out').innerHTML;
        Meteor.call('download', html, function(err, wb) {
            if (err) throw err;
            /* "Browser download file" from SheetJS README */
            XLSX.writeFile(wb, 'database.xlsx');
        });
        }

});
