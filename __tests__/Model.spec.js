import { isObservable } from 'mobx'
import Model from '../src/Model'
import Collection from '../src/Collection'
import apiClient from '../src/apiClient'
import MockApi from './mocks/api'

apiClient(MockApi)

describe(Model, () => {
  class MyModel extends Model {
    urlRoot = () => '/resources'
  }

  it('assigns the passed attributes', () => {
    const model = new Model({
      firstName: 'John',
      lastName: 'Doe'
    })

    expect(model.toJS()).toEqual({
      firstName: 'John',
      lastName: 'Doe'
    })
  })

  it('allows to define default attributes', () => {
    class MyModel extends Model {
      static defaultAttributes = {
        email: null,
        phone: null
      }
    }

    const model = new MyModel({
      firstName: 'John',
      lastName: 'Doe'
    })

    expect(model.toJS()).toEqual({
      firstName: 'John',
      lastName: 'Doe',
      email: null,
      phone: null
    })
  })

  it('assigns an optimistic id', () => {
    const model = new Model()

    expect(model.optimisticId).toBeDefined()
  })

  describe('toJS()', () => {
    it('returns a plain object version of the attributes', () => {
      const model = new Model({ name: 'John' })

      expect(isObservable(model.attributes)).toBe(true)
      expect(isObservable(model.toJS())).toBe(false)
      expect(model.toJS()).toEqual({ name: 'John' })
    })
  })

  describe('url()', () => {
    describe('if the model is new', () => {
      it('returns the url root', () => {
        const model = new MyModel()

        expect(model.url()).toBe('/resources')
      })
    })

    describe('if the model is not new', () => {
      it('returns the url root with the model id', () => {
        const model = new MyModel({ id: 2 })

        expect(model.url()).toBe('/resources/2')
      })
    })

    describe('if the model belongs to a collection and urlRoot is not defined', () => {
      it('uses the collection url as root', () => {
        const model = new Model({ id: 2 })
        const collection = new Collection()

        collection.url = () => '/different-resources'
        model.collection = collection

        expect(model.url()).toBe('/different-resources/2')
      })
    })

    describe('if the model doesn\'t belong to a collection and urlRoot is not defined', () => {
      it('throws', () => {
        const model = new Model({ id: 2 })

        expect(() => model.url()).toThrow('implement `urlRoot` method or `url` on the collection')
      })
    })
  })

  describe('get(attribute)', () => {
    describe('if the attribute is defined', () => {
      it('returns its value', () => {
        const model = new Model({ name: 'John' })

        expect(model.get('name')).toBe('John')
      })
    })

    describe('if the attribute is not defined', () => {
      it('throws', () => {
        const model = new Model({ name: 'John' })

        expect(() => model.get('email')).toThrow('Attribute "email" not found')
      })
    })
  })

  describe('has(attribute)', () => {
    describe('if the attribute is defined', () => {
      it('returns true', () => {
        const model = new Model({ name: 'John' })

        expect(model.has('name')).toBe(true)
      })
    })

    describe('if the attribute is not defined', () => {
      it('returns false', () => {
        const model = new Model({ name: 'John' })

        expect(model.has('email')).toBe(false)
      })
    })
  })

  describe('id', () => {
    describe('if the model has an id attribute', () => {
      it('returns its value', () => {
        const model = new Model({ id: 123 })

        expect(model.id).toBe(123)
      })

      it('allows to customize the primary key attribute', () => {
        class MyModel extends Model {
          get primaryKey () {
            return 'someId'
          }
        }

        const model = new MyModel({ someId: 123 })

        expect(model.id).toBe(123)
      })
    })

    describe('if the model doesn\'t have an id attribute', () => {
      it('returns the optimistic id', () => {
        const model = new Model()

        expect(model.id).toBe(model.optimisticId)
      })
    })
  })

  describe('changedAttributes', () => {
    it('return the attributes names that changed from the last sync', () => {
      const model = new Model({
        name: 'Name 1',
        date: '1900-01-01',
        phone: '123456789'
      })

      model.set({
        name: 'Name 2',
        phone: '987654321'
      })

      expect(model.changedAttributes).toEqual(['name', 'phone'])
    })
  })

  describe('hasChanges(attribute)', () => {
    describe('if an attribute is specified', () => {
      it('returns true if the specified attribute has changes', () => {
        const model = new Model({
          name: 'Name 1',
          date: '1900-01-01',
          phone: '123456789'
        })

        model.set({ name: 'Name 2' })

        expect(model.hasChanges('name')).toBe(true)
      })

      it('returns false if the specified attribute has no changes', () => {
        const model = new Model({
          name: 'Name 1',
          date: '1900-01-01',
          phone: '123456789'
        })

        model.set({ name: 'Name 2' })

        expect(model.hasChanges('date')).toBe(false)
      })

      describe('if no attribute is specified', () => {
        it('returns true if any attribute has changes', () => {
          const model = new Model({
            name: 'Name 1',
            date: '1900-01-01',
            phone: '123456789'
          })

          model.set({ name: 'Name 2' })

          expect(model.hasChanges()).toBe(true)
        })

        it('returns false if no attributes have changes', () => {
          const model = new Model({
            name: 'Name 1',
            date: '1900-01-01',
            phone: '123456789'
          })

          expect(model.hasChanges()).toBe(false)
        })
      })
    })

    it('returns an object with the current changes', () => {
      const model = new Model({
        name: 'Name 1',
        date: '1900-01-01',
        phone: '123456789'
      })

      model.set({
        name: 'Name 2',
        phone: '987654321'
      })

      expect(model.changedAttributes).toEqual(['name', 'phone'])
    })
  })

  describe('changes', () => {
    it('returns an object with the current changes', () => {
      const model = new Model({
        name: 'Name 1',
        date: '1900-01-01',
        phone: '123456789'
      })

      model.set({
        name: 'Name 2'
      })

      model.set({
        name: 'Name 1',
        date: '2000-01-01',
        phone: '987654321'
      })

      expect(model.changes).toEqual({
        date: '2000-01-01',
        phone: '987654321'
      })
    })
  })

  describe('commitChanges()', () => {
    it('accepts the current changes', () => {
      const model = new Model({ phone: '1234' })

      model.set({ phone: '5678' })
      expect(model.hasChanges()).toBe(true)

      model.commitChanges()
      expect(model.hasChanges()).toBe(false)
      expect(model.get('phone')).toBe('5678')
    })
  })

  describe('discardChanges()', () => {
    it('reverts to the last committed attributes', () => {
      const model = new Model({ phone: '1234' })

      model.set({ phone: '5678' })
      expect(model.hasChanges()).toBe(true)

      model.discardChanges()
      expect(model.hasChanges()).toBe(false)
      expect(model.get('phone')).toBe('1234')
    })
  })

  describe('reset(attributes)', () => {
    describe('if attributes is specified', () => {
      it('replaces the current attributes with the specified ones', () => {
        const model = new Model()

        model.reset({ hi: 'bye' })

        expect(model.toJS()).toEqual({ hi: 'bye' })
      })

      it('respects the default attributes', () => {
        class MyModel extends Model {
          static defaultAttributes = {
            someAttribute: 'test'
          }
        }

        const model = new MyModel({ name: 'john' })

        model.reset({ phone: '1234567' })

        expect(model.toJS()).toEqual({
          someAttribute: 'test',
          phone: '1234567'
        })
      })
    })

    describe('if attributes is not specified', () => {
      it('replaces the current attributes with last committed ones', () => {
        const model = new Model({ email: 'test@test.com' })

        model.set({ name: 'test' })
        model.reset()

        expect(model.toJS()).toEqual({ email: 'test@test.com' })
      })
    })
  })

  describe('clear()', () => {
    it('replaces the current attributes with the default ones', () => {
      class MyModel extends Model {
        static defaultAttributes = {
          someAttribute: 'test'
        }
      }
      const model = new MyModel({ name: 'john' })

      model.clear()

      expect(model.toJS()).toEqual({ someAttribute: 'test' })
    })
  })

  describe('set(data)', () => {
    it('merges the data with the current attributes', () => {
      const model = new Model({
        firstName: 'John',
        lastName: 'Doe'
      })

      model.set({
        firstName: 'Test',
        email: 'test@test.com'
      })

      expect(model.toJS()).toEqual({
        firstName: 'Test',
        lastName: 'Doe',
        email: 'test@test.com'
      })
    })
  })

  describe('fetch(options)', () => {
    let spy
    let promise
    let model

    beforeEach(() => {
      model = new Model({ id: 2 })
      model.urlRoot = () => '/resources'
      spy = jest.spyOn(apiClient(), 'get')
      promise = model.fetch({
        data: {
          full: true
        }
      })
    })

    afterEach(() => {
      apiClient().get.mockRestore()
    })

    it('makes a get request to the model url', () => {
      expect(spy).toHaveBeenCalled()
    })

    it('passes the options to the api client', () => {
      expect(spy.mock.calls[0][1]).toEqual({
        data: {
          full: true
        }
      })
    })

    it('tracks the request with the "fetching" label', () => {
      expect(model.isRequest('fetching')).toBe(true)
    })

    it('works without passing options', () => {
      expect(() => model.fetch()).not.toThrow()
    })

    describe('if the request succeeds', () => {
      it('replaces the current data with the response', async () => {
        MockApi.resolvePromise({ id: 2, name: 'John' })
        await promise
        expect(model.toJS()).toEqual({ id: 2, name: 'John' })
      })
    })
  })

  describe('save(attributes, options)', () => {
    let model

    beforeEach(() => {
      model = new Model({ name: 'John', email: 'john@test.com', phone: '1234' })
      model.urlRoot = () => '/resources'
    })

    describe('if is new', () => {
      let spy

      beforeEach(() => {
        spy = jest.spyOn(apiClient(), 'post')
      })

      afterEach(() => {
        apiClient().post.mockRestore()
      })

      it('sends a POST request', () => {
        model.save()
        expect(spy).toHaveBeenCalled()
      })

      describe('if attributes are not specified', () => {
        it('sends the current attributes', () => {
          model.save()
          expect(spy.mock.calls[0][1]).toEqual({
            data: {
              name: 'John',
              email: 'john@test.com',
              phone: '1234'
            }
          })
        })
      })

      describe('if attributes are specified', () => {
        it('sends merges the attributes with the current ones', () => {
          model.save({ phone: '5678' })

          expect(spy.mock.calls[0][1]).toEqual({
            data: {
              name: 'John',
              email: 'john@test.com',
              phone: '5678'
            }
          })
        })

        describe('if optimistic', () => {
          it('immediately assigns the merged attributes', () => {
            model.save({ phone: '5678' }, { optimistic: true })

            expect(model.toJS()).toEqual({
              name: 'John',
              email: 'john@test.com',
              phone: '5678'
            })
          })
        })
      })
    })

    describe('if is not new', () => {
      beforeEach(() => {
        model.set({ id: 2 })
        model.commitChanges()
      })

      describe('if patch = true', () => {
        let spy

        beforeEach(() => {
          spy = jest.spyOn(apiClient(), 'patch')
        })

        afterEach(() => {
          apiClient().patch.mockRestore()
        })

        it('sends a PATCH request', () => {
          model.save({}, { patch: true })
          expect(spy).toHaveBeenCalled()
        })

        describe('if attributes are not specified', () => {
          it('sends the changes compared to the current attributes', () => {
            model.set({ phone: '5678' })
            model.save({}, { patch: true })

            expect(spy.mock.calls[0][1]).toEqual({
              data: {
                phone: '5678'
              }
            })
          })
        })

        describe('if attributes are specified', () => {
          it('sends the changes compared to the merged attributes', () => {
            model.save({ phone: '5678' }, { patch: true })

            expect(spy.mock.calls[0][1]).toEqual({
              data: {
                phone: '5678'
              }
            })
          })

          describe('if optimistic', () => {
            it('immediately assigns the merged attributes', () => {
              model.save({ phone: '5678' }, { optimistic: true, patch: true })

              expect(model.toJS()).toEqual({
                id: 2,
                name: 'John',
                email: 'john@test.com',
                phone: '5678'
              })
            })
          })
        })
      })

      describe('if patch = false', () => {
        let spy

        beforeEach(() => {
          spy = jest.spyOn(apiClient(), 'put')
        })

        afterEach(() => {
          apiClient().put.mockRestore()
        })

        it('sends a PUT request', () => {
          model.save()
          expect(spy).toHaveBeenCalled()
        })

        describe('if attributes are not specified', () => {
          it('sends the current attributes', () => {
            model.save({}, { patch: false })

            expect(spy.mock.calls[0][1]).toEqual({
              data: {
                id: 2,
                name: 'John',
                email: 'john@test.com',
                phone: '1234'
              }
            })
          })
        })

        describe('if attributes are specified', () => {
          it('sends merges the attributes with the current ones', () => {
            model.save({ phone: '5678' }, { patch: false })

            expect(spy.mock.calls[0][1]).toEqual({
              data: {
                id: 2,
                name: 'John',
                email: 'john@test.com',
                phone: '5678'
              }
            })
          })

          describe('if optimistic', () => {
            it('immediately assigns the merged attributes', () => {
              model.save({ phone: '5678' }, { optimistic: true, patch: false })

              expect(model.toJS()).toEqual({
                id: 2,
                name: 'John',
                email: 'john@test.com',
                phone: '5678'
              })
            })
          })
        })
      })
    })

    describe('if the request succeeds', () => {
      it('assigns the response attributes to the model', async () => {
        const promise = model.save({ phone: '5678' }, { optimistic: false })

        expect(model.toJS()).toEqual({
          name: 'John',
          email: 'john@test.com',
          phone: '1234'
        })

        MockApi.resolvePromise({
          id: 2,
          name: 'John',
          email: 'john@test.com',
          phone: '5678'
        })

        await promise

        expect(model.toJS()).toEqual({
          id: 2,
          name: 'John',
          email: 'john@test.com',
          phone: '5678'
        })
      })
    })

    describe('if the request fails', () => {
      describe('if optimistic', () => {
        it('goes back to the original attributes', async () => {
          const promise = model.save({ phone: '5678' }, { optimistic: true })

          expect(model.toJS()).toEqual({
            name: 'John',
            email: 'john@test.com',
            phone: '5678'
          })

          MockApi.rejectPromise('Conflict')

          try {
            await promise
          } catch (_error) {
            expect(model.toJS()).toEqual({
              name: 'John',
              email: 'john@test.com',
              phone: '1234'
            })
          }
        })
      })
    })
  })

  describe('destroy(options)', () => {
    let spy
    let model

    beforeEach(() => {
      model = new Model()
      model.urlRoot = () => '/resources'
      spy = jest.spyOn(apiClient(), 'del')
    })

    afterEach(() => {
      apiClient().del.mockRestore()
    })

    describe('if is new', () => {
      it('don\'t make any request', () => {
        model.destroy()
        expect(spy).not.toHaveBeenCalled()
      })

      describe('if belongs to a collection', () => {
        let collection

        beforeEach(() => {
          collection = new Collection()
          model.collection = collection
          collection.models.push(model)
        })

        it('removes itself from the collection', () => {
          expect(collection.length).toBe(1)
          model.destroy()
          expect(collection.length).toBe(0)
        })
      })
    })

    describe('if is not new', () => {
      beforeEach(() => {
        model.set({ id: 2 })
        model.commitChanges()
      })

      it('makes a DELETE request', () => {
        model.destroy()
        expect(spy).toHaveBeenCalled()
      })

      describe('if optimistic and belongs to a collection', () => {
        let collection

        beforeEach(() => {
          collection = new Collection()
          model.collection = collection
          collection.models.push(model)
        })

        it('immediately removes itself from the collection', () => {
          expect(collection.length).toBe(1)
          model.destroy({ optimistic: true })
          expect(collection.length).toBe(0)
        })
      })

      describe('if the request succeds', () => {
        describe('if not optimistic and belongs to a collection', () => {
          it('removes itself from the collection', async () => {
            const collection = new Collection()

            model.collection = collection
            collection.models.push(model)

            const promise = model.destroy({ optimistic: false })

            expect(collection.length).toBe(1)

            MockApi.resolvePromise({})
            await promise

            expect(collection.length).toBe(0)
          })
        })

        describe('if optimistic or don\'t belongs to a collection', () => {
          it('not throws', async () => {
            model.collection = new Collection()
            model.collection.models.push(model)

            const promise = model.destroy({ optimistic: true })

            MockApi.resolvePromise({})

            await promise
          })
        })
      })

      describe('if the request fails', () => {
        describe('if optimistic and belongs to a collection', () => {
          it('adds itself to the collection again', async () => {
            const collection = new Collection()

            model.collection = collection
            collection.models.push(model)

            const promise = model.destroy({ optimistic: true })

            expect(collection.length).toBe(0)

            MockApi.rejectPromise('Conflict')

            try {
              await promise
            } catch (_error) {
              expect(collection.length).toBe(1)
            }
          })
        })

        describe('if not optimistic or don\'t belongs to a collection', () => {
          it('throws the request response', async () => {
            model.collection = new Collection()
            model.collection.models.push(model)

            const promise = model.destroy({ optimistic: false })

            MockApi.rejectPromise('Conflict')

            try {
              await promise
            } catch (error) {
              expect(error).toBe('Conflict')
            }
          })
        })
      })
    })
  })
})
