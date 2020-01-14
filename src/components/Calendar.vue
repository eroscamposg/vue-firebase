<template>
  <v-row class="fill-height">
    <v-col>
      <v-sheet height="64">
        <v-toolbar flat color="white">
          <v-btn class="mr-4" dark color="primary" @click="dialog = true">
            Agregar
          </v-btn>
          <v-btn outlined class="mr-4" color="grey darken-2" @click="setToday">
            Hoy
          </v-btn>
          <v-btn fab text small color="grey darken-2" @click="prev">
            <v-icon small>mdi-chevron-left</v-icon>
          </v-btn>
          <v-btn fab text small color="grey darken-2" @click="next">
            <v-icon small>mdi-chevron-right</v-icon>
          </v-btn>
          <v-toolbar-title>{{ title }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-menu bottom right>
            <template v-slot:activator="{ on }">
              <v-btn outlined color="grey darken-2" v-on="on">
                <span>{{ typeToLabel[type] }}</span>
                <v-icon right>mdi-menu-down</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="type = 'day'">
                <v-list-item-title>Dia</v-list-item-title>
              </v-list-item>
              <v-list-item @click="type = 'week'">
                <v-list-item-title>Semana</v-list-item-title>
              </v-list-item>
              <v-list-item @click="type = 'month'">
                <v-list-item-title>Mes</v-list-item-title>
              </v-list-item>
              <v-list-item @click="type = '4day'">
                <v-list-item-title>4 Dias</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-toolbar>
      </v-sheet>
      <v-sheet height="600">
        <v-calendar
          ref="calendar"
          v-model="focus"
          color="primary"
          :events="events"
          :event-color="getEventColor"
          :now="today"
          :type="type"
          :weekdays="[1, 2, 3, 4, 5, 6, 0]"
          locale="es"
          :short-weekdays="true"
          @click:event="showEvent"
          @click:more="viewDay"
          @click:date="viewDay"
          @change="updateRange"
        ></v-calendar>

        <!-- Modal Agregar Evento -->
        <v-dialog
          v-model="dialog"
          max-width="500px"
          transition="dialog-transition"
        >
          <v-card>
            <v-container>
              <v-form @submit.prevent="addEvent">
                <v-text-field
                  label="Agregar nombre"
                  type="text"
                  v-model="name"
                ></v-text-field>
                <v-text-field
                  label="Agregar un detalle"
                  type="text"
                  v-model="details"
                ></v-text-field>

                <v-text-field
                  label="Inicio del evento"
                  type="date"
                  v-model="start"
                ></v-text-field>

                <v-text-field
                  label="Fin del evento"
                  type="date"
                  v-model="end"
                ></v-text-field>
                <v-text-field
                  label="Color del evento"
                  type="color"
                  v-model="color"
                ></v-text-field>
                <v-btn
                  class="mr-4"
                  color="success"
                  type="submit"
                  @click.stop="dialog = false"
                  >Agregar</v-btn
                >
              </v-form>
            </v-container>
          </v-card>
        </v-dialog>

        <!-- modal que aparece cuando se hace click a un evento-->
        <v-menu
          v-model="selectedOpen"
          :close-on-content-click="false"
          :activator="selectedElement"
          offset-x
        >
          <v-card color="grey lighten-4" min-width="350px" flat>
            <v-toolbar :color="selectedEvent.color" dark>
              <!-- Evento para borrar -->
              <v-btn icon @click="deleteEvent(selectedEvent)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
              <v-toolbar-title v-html="selectedEvent.name"></v-toolbar-title>
              <v-spacer></v-spacer>
            </v-toolbar>

            <v-card-text>
              <v-form v-if="currentlyEditing !== selectedEvent.id">
                {{ selectedEvent.name }} - {{ selectedEvent.details }}
              </v-form>
              <v-form v-else>
                <v-text-field
                  type="text"
                  v-model="selectedEvent.name"
                  label="Editar nombre"
                ></v-text-field>
                <textarea-autosize
                  v-model="selectedEvent.details"
                  type="text"
                  style="width: 100%"
                  :min-height="100"
                ></textarea-autosize>
              </v-form>
            </v-card-text>

            <v-card-actions>
              <v-btn text color="secondary" @click="selectedOpen = false">
                Cancelar
              </v-btn>
              <!-- Cuando se empiza a editar, entonces quitar el boton de editar -->
              <v-btn
                text
                v-if="currentlyEditing !== selectedEvent.id"
                color="secondary"
                @click.prevent="editEvent(selectedEvent.id)"
              >
                Editar
              </v-btn>
              <v-btn
                text
                color="secondary"
                @click.prevent="updateEvent(selectedEvent)"
                v-else
                >Guardar cambios</v-btn
              >
            </v-card-actions>
          </v-card>
        </v-menu>
      </v-sheet>
    </v-col>
  </v-row>
</template>

<script>
import { db } from "../main";

export default {
  data: () => ({
    focus: new Date().toISOString().substr(0, 10),
    today: new Date().toISOString().substr(0, 10),
    type: "month",
    typeToLabel: {
      month: "Mes",
      week: "Semana",
      day: "Dia",
      "4day": "4 Dias"
    },
    start: null,
    end: null,
    selectedEvent: {},
    selectedElement: null,
    selectedOpen: false,
    events: [],
    colors: [
      "blue",
      "indigo",
      "deep-purple",
      "cyan",
      "green",
      "orange",
      "grey darken-1"
    ],
    names: [
      "Meeting",
      "Holiday",
      "PTO",
      "Travel",
      "Event",
      "Birthday",
      "Conference",
      "Party"
    ],
    name: null,
    details: null,
    color: "#1976d2",
    dialog: false,
    currentlyEditing: null
  }),
  computed: {
    title() {
      const { start, end } = this;
      if (!start || !end) {
        return "";
      }

      const startMonth = this.monthFormatter(start);
      const endMonth = this.monthFormatter(end);
      const suffixMonth = startMonth === endMonth ? "" : endMonth;

      const startYear = start.year;
      const endYear = end.year;
      const suffixYear = startYear === endYear ? "" : endYear;

      const startDay = start.day + this.nth(start.day);
      const endDay = end.day + this.nth(end.day);

      switch (this.type) {
        case "month":
          return `${startMonth} ${startYear}`;
        case "week":
        case "4day":
          return `${startMonth} ${startDay} ${startYear} - ${suffixMonth} ${endDay} ${suffixYear}`;
        case "day":
          return `${startMonth} ${startDay} ${startYear}`;
      }
      return "";
    },
    monthFormatter() {
      return this.$refs.calendar.getFormatter({
        timeZone: "UTC",
        month: "long"
      });
    }
  },
  created() {
    this.getEvents();
  },
  mounted() {
    this.$refs.calendar.checkChange();
  },
  methods: {
    async updateEvent(ev) {
      try {
        await db
          .collection("events")
          .doc(ev.id)
          .update({
            name: ev.name,
            details: ev.details
          });

        this.selectedOpen = false;
        this.currentlyEditing = null;
        this.getEvents();
      } catch (error) {
        console.log(error);
      }
    },
    editEvent(id) {
      this.currentlyEditing = id;
    },
    async deleteEvent(ev) {
      //Borra el evento de la base de datos y vuelve a cargar los eventos
      try {
        await db
          .collection("events")
          .doc(ev.id)
          .delete();
        this.selectedOpen = false;
        this.getEvents();
      } catch (error) {
        console.log(error);
      }
    },
    async addEvent() {
      try {
        //If spaces are filled, then get the db
        if (this.name && this.start && this.end) {
          await db.collection("events").add({
            name: this.name,
            details: this.details,
            start: this.start,
            end: this.end,
            color: this.color
          });

          this.getEvents();

          this.name = null;
          this.details = null;
          this.start = null;
          this.end = null;
          this.color = "#1976d2";
        } else {
          console.log("Campos Obligatorios");
        }
      } catch (error) {
        console.log(error);
      }
    },
    //FIREBASE
    async getEvents() {
      try {
        //gets the events collection in firebase
        const snapshot = await db.collection("events").get();
        const events = [];
        //gets information from every element in events collection
        snapshot.forEach(doc => {
          //console.log(doc.id); //firebase
          let eventData = doc.data();
          eventData.id = doc.id;
          events.push(eventData);
        });

        this.events = events;
      } catch (error) {
        console.log(error);
      }
    },
    viewDay({ date }) {
      this.focus = date;
      this.type = "day";
    },
    getEventColor(event) {
      return event.color;
    },
    setToday() {
      this.focus = this.today;
    },
    prev() {
      this.$refs.calendar.prev();
    },
    next() {
      this.$refs.calendar.next();
    },
    showEvent({ nativeEvent, event }) {
      const open = () => {
        this.selectedEvent = event;
        this.selectedElement = nativeEvent.target;
        setTimeout(() => (this.selectedOpen = true), 10);
      };

      if (this.selectedOpen) {
        this.selectedOpen = false;
        setTimeout(open, 10);
      } else {
        open();
      }

      nativeEvent.stopPropagation();
    },
    updateRange({ start, end }) {
      const events = [];
      // const min = new Date(`${start.date}T00:00:00`);
      // const max = new Date(`${end.date}T23:59:59`);
      // const days = (max.getTime() - min.getTime()) / 86400000;
      // const eventCount = this.rnd(days, days + 20);
      // for (let i = 0; i < eventCount; i++) {
      //   const allDay = this.rnd(0, 3) === 0;
      //   const firstTimestamp = this.rnd(min.getTime(), max.getTime());
      //   const first = new Date(firstTimestamp - (firstTimestamp % 900000));
      //   const secondTimestamp = this.rnd(2, allDay ? 288 : 8) * 900000;
      //   const second = new Date(first.getTime() + secondTimestamp);
      //   events.push({
      //     name: this.names[this.rnd(0, this.names.length - 1)],
      //     start: this.formatDate(first, !allDay),
      //     end: this.formatDate(second, !allDay),
      //     color: this.colors[this.rnd(0, this.colors.length - 1)]
      //   });
      // }
      this.start = start;
      this.end = end;
      this.events = events;
    },
    nth(d) {
      return d > 3 && d < 21
        ? "th"
        : ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"][d % 10];
    },
    rnd(a, b) {
      return Math.floor((b - a + 1) * Math.random()) + a;
    },
    formatDate(a, withTime) {
      return withTime
        ? `${a.getFullYear()}-${a.getMonth() +
            1}-${a.getDate()} ${a.getHours()}:${a.getMinutes()}`
        : `${a.getFullYear()}-${a.getMonth() + 1}-${a.getDate()}`;
    }
  }
};
</script>
